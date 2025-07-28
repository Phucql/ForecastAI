import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import chardet from 'chardet';

dotenv.config();

import multer from 'multer';
import AWS from 'aws-sdk';
import fs from 'fs';
import Papa from 'papaparse';
import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import path from 'path'; // Added for path.join

import { mergeForecastFiles } from './utils/mergeForecastFiles.js';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

function mapChardetToNodeEncoding(enc: string | null | undefined): BufferEncoding {
  if (!enc) return 'utf8';
  const lower = enc.toLowerCase();
  if (lower === 'utf-8' || lower === 'utf8') return 'utf8';
  if (lower === 'utf-16le' || lower === 'utf16le') return 'utf16le';
  if (lower === 'ascii') return 'ascii';
  if (lower === 'latin1' || lower === 'iso-8859-1') return 'latin1';
  // fallback
  return 'utf8';
}

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

// Update multer config for large files
const upload = multer({ dest: 'uploads/', limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB
const { Pool } = pkg;
const app = express();
const port = 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const COOKIE_NAME = 'token';

app.use(cookieParser());
app.use(cors({
  origin: ['https://foodforecastai.netlify.app', 'http://localhost:5173'],
  credentials: true
}));

// Example user (replace with DB lookup in production)
const USERS = [{ username: 'admin', passwordHash: bcrypt.hashSync('password123', 10) }];

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.json({ success: true });
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: true, sameSite: 'lax' });
  res.json({ success: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

app.use(express.json());


AWS.config.update({
  accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
  region: process.env.VITE_AWS_REGION
});

const s3 = new AWS.S3({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  }
});

// S3 client for Forecast_Result bucket
const s3Result = new AWS.S3({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  }
});
const FORECAST_RESULT_BUCKET = 'forecastai-file-upload';
const FORECAST_RESULT_PREFIX = 'Forecast_Result/';

const requiredEnvVars = ['VITE_DB_HOST', 'VITE_DB_NAME', 'VITE_DB_USER', 'VITE_DB_PASSWORD'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
const parseS3Csv = async (bucket: string, key: string): Promise<any[]> => {
  const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  
  // Use chardet to detect encoding instead of hardcoded utf-8
  const csvBuffer = data.Body as Buffer;
  const csvEncoding = mapChardetToNodeEncoding(chardet.detect(csvBuffer));
  const csvContent = csvBuffer.toString(csvEncoding);

  if (!csvContent) throw new Error('S3 CSV content is empty');

  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

  if (parsed.errors.length) {
    console.error('[CSV PARSE ERRORS]', parsed.errors);
    throw new Error('Failed to parse CSV data');
  }

  return parsed.data;
};

const insertRows = async (table: string, rows: any[]) => {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map(col => `"${col}"`).join(',');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');

  const client = await pool.connect();
  try {
    for (const row of rows) {
      const values = columns.map(c => row[c]);
      await client.query(`INSERT INTO "${table}" (${quotedColumns}) VALUES (${placeholders})`, values);
    }
  } finally {
    client.release();
  }
};


app.post('/api/upload-to-forecast-tables', async (req, res) => {
  const { originalKey, forecastKey } = req.body;

  console.log('📦 Upload originalKey:', originalKey);
  console.log('📦 Upload forecastKey:', forecastKey);

  const bucket = process.env.VITE_S3_BUCKET_NAME!;

  if (!forecastKey) {
    return res.status(400).json({ error: 'Missing forecastKey' });
  }

  try {
    const parseDateField = (rows: any[]) => {
      return rows.map(row => {
        if (row.TIM_LVL_MEMBER_VALUE) {
          const d = new Date(row.TIM_LVL_MEMBER_VALUE);
          if (!isNaN(d.getTime())) {
            row.TIM_LVL_MEMBER_VALUE = d.toISOString().split('T')[0];
          }
        }
        return row;
      });
    };

    if (originalKey) {
      const originalRows = parseDateField(await parseS3Csv(bucket, originalKey));
      await insertRows('forecast_original', originalRows);
    }
    const forecastRows = parseDateField(await parseS3Csv(bucket, forecastKey));
    await insertRows('forecast_result', forecastRows);

    console.log('✅ Data uploaded to forecast tables');
    res.status(200).json({ message: 'Data uploaded to forecast tables' });
  } catch (err: any) {
    console.error('[Upload Tables Error]', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});


const pool = new Pool({
  host: process.env.VITE_DB_HOST,
  database: process.env.VITE_DB_NAME,
  user: process.env.VITE_DB_USER,
  password: process.env.VITE_DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

let isPoolEnding = false;

const gracefulShutdown = async () => {
  if (isPoolEnding) return;
  isPoolEnding = true;
  console.log('Closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }
};

pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('✅ Successfully connected to the database');
    done();
  }
});



app.get('/api/list-forecasts', async (_req, res) => {
  const s3 = new AWS.S3();
  const bucket = process.env.VITE_S3_BUCKET_NAME!;
  const prefix = 'forecasts/';

  try {
    const data = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: prefix,
    }).promise();

    const files = (data.Contents || []).map(obj => {
      const key = obj.Key!;
      const name = key.replace(prefix, '');
      return {
        key,
        name,
        owner: 'veispinoza@kl.gscl.com',
        status: name.includes('copy') ? 'Draft' : 'Active',
      };
    });
    res.json(files);
  } catch (err: any) {
    console.error('[List Forecasts Error]', err);
    
    // Provide more specific error messages based on the error type
    if (err.code === 'AccessDenied') {
      res.status(403).json({ 
        error: 'AWS S3 Access Denied', 
        details: 'Your IAM user does not have permission to list files in the S3 bucket. Please check AWS IAM permissions.',
        code: 'S3_ACCESS_DENIED',
        bucket: bucket
      });
    } else if (err.code === 'NoSuchBucket') {
      res.status(404).json({ 
        error: 'S3 Bucket Not Found', 
        details: 'The specified S3 bucket does not exist.',
        code: 'S3_BUCKET_NOT_FOUND',
        bucket: bucket
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to list forecast files',
        details: err.message || 'Unknown S3 error',
        code: 'S3_ERROR'
      });
    }
  }
});

app.get('/api/db-check', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (error) {
    console.error('❌ DB connection failed:', error);
    res.status(500).json({ error: 'Failed to connect to DB' });
  }
});

app.get('/', (_req, res) => {
  res.json({ message: '🚀 API server is running! Try hitting any /api endpoint' });
});

app.get('/api/planning-units', async (_req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT "Planning Unit" FROM "inital_db" WHERE "Planning Unit" IS NOT NULL ORDER BY "Planning Unit"');
    res.json(result.rows.map(r => r['Planning Unit']));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch planning units' });
  }
});

app.get('/api/business-units', async (req, res) => {
  const { planningUnit } = req.query;
  try {
    const result = await pool.query('SELECT DISTINCT "Business Unit" FROM "inital_db" WHERE "Planning Unit" = $1 AND "Business Unit" IS NOT NULL ORDER BY "Business Unit"', [planningUnit]);
    res.json(result.rows.map(r => r['Business Unit']));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch business units' });
  }
});

app.get('/api/families', async (req, res) => {
  const { businessUnit } = req.query;
  try {
    const result = await pool.query('SELECT DISTINCT "Family" FROM "inital_db" WHERE "Business Unit" = $1 AND "Family" IS NOT NULL ORDER BY "Family"', [businessUnit]);
    res.json(result.rows.map(r => r['Family']));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch families' });
  }
});

app.get('/api/subfamilies', async (req, res) => {
  const { family } = req.query;
  try {
    const result = await pool.query('SELECT DISTINCT "Subfamily" FROM "inital_db" WHERE "Family" = $1 AND "Subfamily" IS NOT NULL ORDER BY "Subfamily"', [family]);
    res.json(result.rows.map(r => r['Subfamily']));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subfamilies' });
  }
});

app.get('/api/colors', async (req, res) => {
  const { subfamily } = req.query;
  try {
    const result = await pool.query('SELECT DISTINCT "Color" FROM "inital_db" WHERE "Subfamily" = $1 AND "Color" IS NOT NULL ORDER BY "Color"', [subfamily]);
    res.json(result.rows.map(r => r['Color']));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch colors' });
  }
});

app.get('/api/products', async (req, res) => {
  const { color } = req.query;
  console.log('[DEBUG] Incoming /api/products color:', color);

  const parsedColor = color && /^\d+$/.test(color.toString()) ? Number(color) : color;

  try {
    const query = `
      SELECT DISTINCT "PRD_LVL_MEMBER_NAME"
      FROM "inital_db"
      WHERE "Color" = $1
        AND "PRD_LVL_MEMBER_NAME" IS NOT NULL
      ORDER BY "PRD_LVL_MEMBER_NAME"
    `;

    const result = await pool.query(query, [parsedColor]);
    console.log('[DEBUG] Products found:', result.rows.length);

    res.json(result.rows.map(r => r["PRD_LVL_MEMBER_NAME"]));
  } catch (err) {
    console.error('[ERROR] Failed to fetch products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/demand-classes', async (req, res) => {
  const { businessUnit } = req.query;
  try {
    let query = 'SELECT DISTINCT "Customer Class Code" FROM "inital_db" WHERE "Customer Class Code" IS NOT NULL';
    let params: any[] = [];
    if (businessUnit) {
      query += ' AND "Business Unit" = $1';
      params.push(businessUnit);
    }
    query += ' ORDER BY "Customer Class Code"';
    const result = await pool.query(query, params);
    const arr = Array.isArray(result.rows) ? result.rows.map(r => r['Customer Class Code']) : [];
    res.json(arr);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/available-demand-classes', async (req, res) => {
  const { planningUnit, businessUnit, family, subfamily, color, product } = req.query;
  try {
    let query = 'SELECT DISTINCT "Customer Class Code" FROM "inital_db" WHERE "Customer Class Code" IS NOT NULL';
    const params = [];
    let idx = 1;
    if (planningUnit) {
      query += ` AND "Planning Unit" ILIKE $${idx++}`;
      params.push(`%${planningUnit}%`);
    }
    if (businessUnit) {
      query += ` AND "Business Unit" ILIKE $${idx++}`;
      params.push(`%${businessUnit}%`);
    }
    if (family) {
      query += ` AND "Family" ILIKE $${idx++}`;
      params.push(`%${family}%`);
    }
    if (subfamily) {
      query += ` AND "Subfamily" ILIKE $${idx++}`;
      params.push(`%${subfamily}%`);
    }
    if (color) {
      query += ` AND "Color" ILIKE $${idx++}`;
      params.push(`%${color}%`);
    }
    if (product) {
      query += ` AND "PRD_LVL_MEMBER_NAME" ILIKE $${idx++}`;
      params.push(`%${product}%`);
    }
    query += ' ORDER BY "Customer Class Code"';
    const result = await pool.query(query, params);
    const arr = Array.isArray(result.rows) ? result.rows.map(r => r['Customer Class Code']) : [];
    res.json(arr);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/calendar-data', async (_req, res) => {
  try {
    const query = `
        SELECT DISTINCT 
          TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM-DD') AS full_date,
          TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY') AS year,
          TO_CHAR("TIM_LVL_MEMBER_VALUE", 'MM') AS month
        FROM "inital_db"
        WHERE "TIM_LVL_MEMBER_VALUE" IS NOT NULL
        ORDER BY full_date DESC
      `;
    const result = await pool.query(query);
    const response = result.rows.map(row => ({
      date: row.full_date,
      year: row.year,
      month: row.month
    }));
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

app.get('/api/item-colors', async (_req, res) => {
  try {
    const query = `
      SELECT DISTINCT "Color" AS color
      FROM "inital_db"
      WHERE "Color" IS NOT NULL
      ORDER BY "Color"
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching item colors:', error);
    res.status(500).json({ error: 'Failed to fetch item colors' });
  }
});

app.get('/api/customer-names', async (_req, res) => {
  try {
    const query = `
      SELECT DISTINCT "Customer Name" AS "customerName"
      FROM "inital_db"
      WHERE "Customer Name" IS NOT NULL
      ORDER BY "Customer Name"
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching customer names:', error);
    res.status(500).json({ error: 'Failed to fetch customer names' });
  }
});

app.get('/api/item-subfamilies', async (_req, res) => {
  try {
    const query = `
      SELECT DISTINCT "Subfamily" AS subfamily
      FROM "inital_db"
      WHERE "Subfamily" IS NOT NULL
      ORDER BY "Subfamily"
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching subfamilies:', error);
    res.status(500).json({ error: 'Failed to fetch subfamilies' });
  }
});

app.get('/api/collected-families', async (_req, res) => {
  try {
    const query = `
      SELECT DISTINCT "Family" AS family
      FROM "inital_db"
      WHERE "Family" IS NOT NULL
      ORDER BY "Family"
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching family data:', error);
    res.status(500).json({ error: 'Failed to fetch family data' });
  }
});

app.post('/api/forecast-export', async (req, res) => {
  const {
    planningUnit,
    businessUnit,
    family,
    subfamily,
    color,
    product: prdLvlMemberName,
    demandClass,
  } = req.body;

  console.log('[Forecast Export Filters]', req.body);

  try {
    const values = [planningUnit, businessUnit, family, subfamily, color];
    let query = `
      SELECT *
      FROM "inital_db"
      WHERE "Planning Unit" ILIKE $1
        AND "Business Unit" ILIKE $2
        AND "Family" ILIKE $3
        AND "Subfamily" ILIKE $4
        AND "Color" ILIKE $5
    `;

    if (prdLvlMemberName) {
      values.push(prdLvlMemberName);
      query += ` AND "PRD_LVL_MEMBER_NAME" ILIKE $${values.length}`;
    }

    values.push(demandClass);
    query += ` AND "Customer Class Code" ILIKE $${values.length}`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).send('No matching forecast data found');
    }

    const csv = Papa.unparse(result.rows, { quotes: true, header: true });
    res.header('Content-Type', 'text/csv');
    res.send(csv);
  } catch (error) {
    console.error('EXPORT ERROR:', error);
    res.status(500).json({ error: 'Failed to export forecast data' });
  }
});



app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('[UPLOAD] Request received');

  if (!req.file) {
    console.error('[UPLOAD] No file attached in request');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('[UPLOAD] File info:', req.file);

  const fileContent = fs.readFileSync(req.file.path);

  const params = {
    Bucket: process.env.VITE_S3_BUCKET_NAME!,
    Key: `forecasts/${req.file.originalname || `forecast_${Date.now()}.csv`}`,
    Body: fileContent,
    ContentType: 'text/csv',
    Metadata: {
      owner: req.body.owner || 'unknown',
      description: req.body.description || '',
      status: 'Draft'
    }
  };
  

  try {
    const data = await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); 

    console.log('[UPLOAD] Upload success:', data.Location);
    res.json({ message: 'File uploaded to S3', location: data.Location });
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    res.status(500).json({ error: 'Failed to upload to S3' });
  }
});

// 🆕 Forecast Files List Endpoint
app.get('/api/forecast-files', async (_req, res) => {
  try {
    const listParams = {
      Bucket: process.env.VITE_S3_BUCKET_NAME!,
      Prefix: 'forecasts/',
    };

    const data = await s3.listObjectsV2(listParams).promise();
    const files = await Promise.all(
      (data.Contents || []).map(async (obj) => {
        const head = await s3.headObject({
          Bucket: process.env.VITE_S3_BUCKET_NAME!,
          Key: obj.Key!,
        }).promise();

        return {
          key: obj.Key,
          name: obj.Key?.split('/').pop(),
          owner: head.Metadata?.owner || 'Unknown',
          status: head.Metadata?.status || 'Draft',
          description: head.Metadata?.description || '',
          lastModified: obj.LastModified,
        };
      })
    );

    res.json(files);
  } catch (error) {
    console.error('[S3 LIST ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch forecast files' });
  }
});

app.delete('/api/delete-file', async (req, res) => {
  const key = req.query.key as string;

  if (!key) {
    return res.status(400).json({ error: 'Missing file key' });
  }

  try {
    await s3.deleteObject({
      Bucket: process.env.VITE_S3_BUCKET_NAME!,
      Key: key
    }).promise();

    console.log(`[DELETE] File deleted: ${key}`);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('[DELETE ERROR]', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.post('/api/duplicate-forecast', async (req, res) => {
  const { file } = req.query;

  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid file name' });
  }

  const bucket = process.env.VITE_S3_BUCKET_NAME!;
  const sourceKey = `forecasts/${file}`;
  const timestamp = Date.now();
  const targetKey = `forecasts/${file.replace('.csv', `_copy_${timestamp}.csv`)}`;

  const s3 = new AWS.S3();

  console.log('[DUPLICATE REQUEST]', {
    bucket,
    sourceKey,
    targetKey,
    copySource: `/${bucket}/${sourceKey}`
  });

  try {
    const result = await s3.copyObject({
      Bucket: bucket,
      CopySource: `/${bucket}/${sourceKey}`, 
      Key: targetKey,
    }).promise();

    console.log('[✅ DUPLICATED]', result);
    res.json({ message: 'File duplicated successfully', newKey: targetKey });
  } catch (err) {
    console.error('[❌ Duplicate File Error]', JSON.stringify(err, null, 2));
    res.status(500).json({ error: 'Failed to duplicate file' });
  }
});

app.get('/api/fetch-csv', async (req, res) => {
  const key = req.query.key as string;

  if (!key) {
    return res.status(400).json({ error: 'Missing file key' });
  }

  console.log('[FETCH CSV] Key:', key);

  try {
    const data = await s3.getObject({
      Bucket: process.env.VITE_S3_BUCKET_NAME!,
      Key: key,
    }).promise();

    res.header('Content-Type', 'text/csv');
    res.send(data.Body);
  } catch (error: any) {
    console.error('[FETCH CSV ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch CSV file from S3', message: error.message });
  }
});

app.get('/api/read-forecast-csv', async (req, res) => {
  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  try {
    const data = await s3.getObject({
      Bucket: process.env.VITE_S3_BUCKET_NAME!,
      Key: key,
    }).promise();

    // 🆕 Disable caching and always return new content
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/csv');

    // Use chardet to detect encoding instead of hardcoded utf-8
    const csvBuffer = data.Body as Buffer;
    const csvEncoding = mapChardetToNodeEncoding(chardet.detect(csvBuffer));
    const csvContent = csvBuffer.toString(csvEncoding);
    
    if (!csvContent) throw new Error('Empty CSV content');

    // Replace "TimeGPT" with "Klug Forecast AI" in the CSV content
    const modifiedContent = csvContent.replace(/TimeGPT/g, 'Klug Forecast AI');

    res.send(modifiedContent);
  } catch (err) {
    console.error('[S3 READ ERROR]', err);
    res.status(500).json({ error: 'Failed to read forecast CSV' });
  }
});

app.get('/api/download-csv', async (req, res) => {
  const key = req.query.key as string;

  if (!key) {
    return res.status(400).json({ error: 'Missing S3 file key' });
  }

  const params = {
    Bucket: process.env.VITE_S3_BUCKET_NAME!,
    Key: key,
  };

  try {
    const data = await s3.getObject(params).promise();
    
    // Use chardet to detect encoding instead of hardcoded utf-8
    const csvBuffer = data.Body as Buffer;
    const csvEncoding = mapChardetToNodeEncoding(chardet.detect(csvBuffer));
    const csvContent = csvBuffer.toString(csvEncoding);
    
    // Replace "TimeGPT" with "Klug Forecast AI" in the CSV content
    const modifiedContent = csvContent.replace(/TimeGPT/g, 'Klug Forecast AI');
    
    res.header('Content-Type', 'text/csv');
    res.send(modifiedContent);
  } catch (err) {
    console.error('[Download CSV Error]', err);
    res.status(500).json({ error: 'Failed to download CSV from S3' });
  }
});

// Proxy to TimeGPT API

const waitForObject = async (Key: string, retries = 1, delay = 100): Promise<AWS.S3.GetObjectOutput> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await s3.getObject({ Bucket: process.env.VITE_S3_BUCKET_NAME!, Key }).promise();
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn(`[WAIT RETRY] ${Key} not ready yet... retry ${i + 1}`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error(`File ${Key} not available after ${retries} retries`);
};

// Test endpoint to check Python environment
app.get('/api/test-python', async (req, res) => {
  try {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    console.log(`[TEST] Testing Python executable: ${pythonPath}`);
    
    // Test environment variables
    const timegptKey = process.env.TIMEGPT_API_KEY || process.env.VITE_TIMEGPT_API_KEY;
    console.log(`[TEST] TIMEGPT_API_KEY available: ${timegptKey ? 'Yes' : 'No'}`);
    
    const py = spawn(pythonPath, ['-c', `
import sys
import os
print("Python version:", sys.version)
print("Current directory:", os.getcwd())
print("TIMEGPT_API_KEY available:", "Yes" if os.getenv("TIMEGPT_API_KEY") or os.getenv("VITE_TIMEGPT_API_KEY") else "No")
try:
    import pandas
    print("Pandas version:", pandas.__version__)
except ImportError as e:
    print("Pandas import failed:", e)
try:
    import nixtla
    print("Nixtla available")
except ImportError as e:
    print("Nixtla import failed:", e)
`]);
    
    let result = '';
    let error = '';
    
    py.stdout.on('data', data => result += data.toString());
    py.stderr.on('data', data => error += data.toString());
    
    py.on('close', (code) => {
      if (code === 0) {
        res.json({ 
          success: true, 
          output: result, 
          pythonPath,
          timegptKeyAvailable: !!timegptKey
        });
      } else {
        res.status(500).json({ error: 'Python test failed', stderr: error, code });
      }
    });
    
    py.on('error', (err) => {
      res.status(500).json({ error: 'Failed to spawn Python', details: err.message });
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Test failed', details: err.message });
  }
});

// Enhanced Python environment test
app.get('/api/test-python-env', async (req, res) => {
  try {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    console.log(`[TEST ENV] Testing Python environment: ${pythonPath}`);
    
    // In production (dist folder), the script is in the root of dist
    // In development, it's in the root folder
    let scriptPath = path.join(process.cwd(), 'test_render_python.py');
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(process.cwd(), '..', 'test_render_python.py');
    }
    console.log(`[TEST ENV] Script path: ${scriptPath}`);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`[TEST ENV] Script not found: ${scriptPath}`);
      console.error(`[TEST ENV] Current directory: ${process.cwd()}`);
      console.error(`[TEST ENV] Available files:`, fs.readdirSync(process.cwd()));
      return res.status(500).json({ error: 'Test script not found', scriptPath });
    }
    
    const py = spawn(pythonPath, [scriptPath]);
    
    let result = '';
    let error = '';
    
    py.stdout.on('data', data => result += data.toString());
    py.stderr.on('data', data => error += data.toString());
    
    py.on('close', (code) => {
      console.log(`[TEST ENV] Python process exited with code: ${code}`);
      console.log(`[TEST ENV] Output: ${result}`);
      if (error) console.log(`[TEST ENV] Error: ${error}`);
      
      if (code === 0) {
        res.json({ 
          success: true, 
          output: result, 
          error: error,
          pythonPath,
          scriptPath 
        });
      } else {
        res.status(500).json({ 
          error: 'Python environment test failed', 
          stderr: error, 
          stdout: result,
          code 
        });
      }
    });
    
    py.on('error', (err) => {
      console.error(`[TEST ENV] Spawn error: ${err.message}`);
      res.status(500).json({ error: 'Failed to spawn Python', details: err.message });
    });
  } catch (err: any) {
    console.error(`[TEST ENV] Exception: ${err.message}`);
    res.status(500).json({ error: 'Test failed', details: err.message });
  }
});

app.post('/api/run-forecast-py', async (req, res) => {
  const { originalFileName, horizon, id } = req.body;

  // Always use the S3 CSV as the source of truth
  const baseFileName = originalFileName || id || 'forecast_file';
  const originalKey = `forecasts/${baseFileName}.csv`;
  const bucket = process.env.VITE_S3_BUCKET_NAME!;

  try {
    // Download and decode the original CSV from S3
    const originalData = await s3.getObject({ Bucket: bucket, Key: originalKey }).promise();
    const originalBuffer = originalData.Body as Buffer;
    const originalEncoding = mapChardetToNodeEncoding(chardet.detect(originalBuffer));
    const originalCsv = originalBuffer.toString(originalEncoding);

    // Parse CSV to JS object
    const parsed = Papa.parse(originalCsv, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
      console.error('[CSV PARSE ERRORS]', parsed.errors);
      return res.status(400).json({ error: 'Failed to parse original CSV' });
    }
    const rows = parsed.data;

    // Build the series array for Python
    const series = rows.map(row => ({
      time: (row as any).TIM_LVL_MEMBER_VALUE,
      target: Number((row as any).VALUE_NUMBER),
      PRD_LVL_MEMBER_NAME: (row as any).PRD_LVL_MEMBER_NAME
    }));

    // Log S3 key and file size
    console.log('Reading original CSV from S3:', { originalKey, fileSize: originalBuffer.length });

    // Build the JSON payload for Python
    const payload = {
      series,
      horizon: req.body.horizon,
      api_key: process.env.TIMEGPT_API_KEY || process.env.VITE_TIMEGPT_API_KEY
    };
    const payloadString = JSON.stringify(payload);
    console.log('Payload sent to Python (first 500 chars):', payloadString.slice(0, 500));

    // Use a configurable Python path for deployment friendliness
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    console.log(`[Forecast] Using Python executable: ${pythonPath}`);
    
    // Use the full path to the forecast_runner.py file
    // In production (dist folder), the script is in the root of dist
    // In development, it's in the src folder
    let scriptPath = path.join(process.cwd(), 'forecast_runner.py');
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(process.cwd(), 'src', 'forecast_runner.py');
    }
    console.log(`[Forecast] Script path: ${scriptPath}`);
    
    // Check if the script file exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`[Forecast] Script file not found: ${scriptPath}`);
      console.error(`[Forecast] Current directory: ${process.cwd()}`);
      console.error(`[Forecast] Available files:`, fs.readdirSync(process.cwd()));
      return res.status(500).json({ error: 'Forecast script not found' });
    }
    
    const py = spawn(
      pythonPath,
      [scriptPath]
    );
    console.log('[Forecast] Spawned Python process for forecast_runner.py');
    
    // Handle spawn errors
    py.on('error', (err) => {
      clearTimeout(timeout);
      console.error('[PYTHON SPAWN ERROR]', err);
      console.error('[PYTHON SPAWN ERROR] Python path:', pythonPath);
      console.error('[PYTHON SPAWN ERROR] Script path:', scriptPath);
      console.error('[PYTHON SPAWN ERROR] Current directory:', process.cwd());
      res.status(500).json({ 
        error: 'Failed to spawn Python process', 
        details: err.message,
        pythonPath,
        scriptPath,
        currentDir: process.cwd()
      });
    });
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('[PYTHON TIMEOUT] Process took too long, killing...');
      py.kill('SIGKILL');
      res.status(500).json({ error: 'Python process timed out' });
    }, 300000); // 5 minutes timeout
    
    // Send payload via stdin instead of command line argument
    py.stdin.write(payloadString);
    py.stdin.end();
    
    // Handle stdin errors
    py.stdin.on('error', (err) => {
      console.error('[PYTHON STDIN ERROR]', err);
      res.status(500).json({ error: 'Failed to send data to Python process' });
    });

    let result = '';
    let error = '';

    py.stdout.on('data', data => result += data.toString());
    py.stderr.on('data', data => {
      const msg = data.toString().trim();
      if (msg.toLowerCase().includes("error") || msg.toLowerCase().includes("traceback")) {
        error += msg;
      } else {
        console.log("[PYTHON STDERR]", msg);
      }
    });

    py.on('close', async code => {
      clearTimeout(timeout); // Clear the timeout
      console.log('[PYTHON RAW STDOUT]', result);
      console.log('[PYTHON RAW STDERR]', error);
      console.log('[PYTHON EXIT CODE]', code);
      console.log('[PYTHON PROCESS INFO]', { pythonPath, scriptPath: 'forecast_runner.py' });

      // Check if the result contains an error JSON
      if (result.trim().startsWith('{"error":')) {
        try {
          const errorResult = JSON.parse(result);
          return res.status(500).json({ error: errorResult.error, details: errorResult });
        } catch (parseErr) {
          console.error('[PYTHON ERROR PARSE FAILED]', parseErr);
        }
      }

      if (code !== 0) {
        return res.status(500).json({ error: `Python process failed with exit code ${code}`, stderr: error });
      }

      if (error) {
        return res.status(500).json({ error });
      }

      try {
        if (!result.trim()) {
          return res.status(500).json({ error: "Python process returned empty result" });
        }
        
        const parsed = JSON.parse(result);
        const forecastCsv = Papa.unparse(parsed);

        // Only upload to Forecast_Result folder in the main bucket
        const today = new Date().toISOString().slice(0, 10);
        const forecastFileNameOnly = `Klug Forecast AI_${today}.csv`;
        // const forecastFileName = `forecasts/${forecastFileNameOnly}`;
        // const mergedKey = `forecasts/${baseFileName}_merged_${today}.csv`;

        // Remove this block:
        // await s3.upload({
        //   Bucket: process.env.VITE_S3_BUCKET_NAME!,
        //   Key: forecastFileName,
        //   Body: forecastCsv,
        //   ContentType: 'text/csv',
        //   Metadata: {
        //     owner: 'ForecastAI',
        //     status: 'Active',
        //     description: `Forecast generated for ${baseFileName}.csv on ${today}`
        //   }
        // }).promise();

        // Only upload to Forecast_Result
        await s3Result.upload({
          Bucket: FORECAST_RESULT_BUCKET,
          Key: FORECAST_RESULT_PREFIX + forecastFileNameOnly,
          Body: forecastCsv,
          ContentType: 'text/csv',
          Metadata: {
            owner: 'ForecastAI',
            status: 'Active',
            description: `Forecast generated for ${baseFileName}.csv on ${today}`
          }
        }).promise();

        res.json({
          message: 'Forecast complete',
          forecastFile: FORECAST_RESULT_PREFIX + forecastFileNameOnly,
          result: parsed
        });
      } catch (parseErr) {
        console.error("❌ Failed to parse or merge:", parseErr);
        res.status(500).json({ error: "Failed to parse or merge", details: result });
      }
    });
  } catch (err) {
    console.error('[Forecast Error]', (err as any));
    res.status(500).json({ error: (err as any).message || 'Forecast failed' });
  }
});



app.post('/api/merge-forecast-files', async (req, res) => {
  const { originalKey, forecastKey } = req.body;
  console.log('[DEBUG] Incoming keys:', originalKey, forecastKey);


  if (!originalKey || !forecastKey) {
    return res.status(400).json({ error: 'Missing originalKey or forecastKey' });
  }

  try {
    const mergedCsv = await mergeForecastFiles(
      originalKey,
      forecastKey
    );

    const today = new Date().toISOString().slice(0, 10);
    const baseName = originalKey.split('/').pop()?.replace('.csv', '') || 'merged';
    const mergedKey = `forecasts/${baseName}_merged_${today}.csv`;


    await s3.upload({
      Bucket: process.env.VITE_S3_BUCKET_NAME!,
      Key: mergedKey,
      Body: mergedCsv,
      ContentType: 'text/csv',
      Metadata: {
        owner: 'ForecastAI',
        status: 'Final',
        description: `Merged manually for ${originalKey} + ${forecastKey}`
      }
    }).promise();

    res.json({ message: 'Merge successful', mergedFile: mergedKey });
  } catch (err) {
    console.error('[MERGE ERROR]', err);
    res.status(500).json({ error: 'Failed to merge forecast files' });
  }
});

app.get('/api/forecast-results', async (req, res) => {
  try {
    const listParams = {
      Bucket: process.env.VITE_S3_BUCKET_NAME!,
      Prefix: 'forecast_result/', // folder where you save forecast results
    };

    const data = await s3.listObjectsV2(listParams).promise();

    const files = (data.Contents || []).filter(obj => obj.Key?.endsWith('.csv'));

    const parsedResults = await Promise.all(
      files.map(async (file) => {
        const obj = await s3.getObject({
          Bucket: process.env.VITE_S3_BUCKET_NAME!,
          Key: file.Key!,
        }).promise();

        const csvBuffer = obj.Body as Buffer;
        const csvEncoding = mapChardetToNodeEncoding(chardet.detect(csvBuffer));
        const csvContent = csvBuffer.toString(csvEncoding);
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

        return {
          name: file.Key!.split('/').pop(),
          lastModified: file.LastModified,
          rows: parsed.data,
        };
      })
    );

    res.json(parsedResults);
  } catch (err) {
    console.error('[Forecast Results Error]', err);
    res.status(500).json({ error: 'Failed to fetch forecast results' });
  }
});


app.get('/api/final-forecast-report', async (req, res) => {
  try {
    const client = await pool.connect();

    // Actuals from forecast_original
    const result = await client.query(`
      SELECT 
        f."PRD_LVL_MEMBER_NAME" AS item,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2023 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2023,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2024 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2024,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2025 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2026 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2026
      FROM forecast_original f
      GROUP BY f."PRD_LVL_MEMBER_NAME"
    `);

    // First, get the column names from the forecast_result table
    const columnQuery = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'forecast_result' 
      AND column_name NOT IN ('PRD_LVL_MEMBER_NAME', 'TIM_LVL_MEMBER_VALUE')
      ORDER BY ordinal_position
    `);
    
    // Use the actual database column name for SQL queries, but always display "Klug Forecast AI"
    const actualColumnName = columnQuery.rows[0]?.column_name || 'Klug Forecast AI';
    const forecastColumnName = 'Klug Forecast AI'; // Always display this name on frontend
    
    // Forecasts from forecast_result
    const resultForecast = await client.query(`
      SELECT 
        t."PRD_LVL_MEMBER_NAME" AS item,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2025 THEN t."${actualColumnName}" ELSE 0 END) AS forecast2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2026 THEN t."${actualColumnName}" ELSE 0 END) AS forecast2026
      FROM forecast_result t
      GROUP BY t."PRD_LVL_MEMBER_NAME"
    `);

    client.release();

    // Map forecast data
    const forecastMap = new Map();
    for (const row of resultForecast.rows) {
      forecastMap.set(row.item, {
        forecast2025: Number(row.forecast2025),
        forecast2026: Number(row.forecast2026),
      });
    }

    // Merge and calculate adjusted forecasts
    const formatted = result.rows.map((row) => {
      const forecast = forecastMap.get(row.item) || { forecast2025: 0, forecast2026: 0 };
      const adjusted2025 = forecast.forecast2025 * 1.05;
      const adjusted2026 = forecast.forecast2026 * 1.05;

      return {
        item: row.item,
        history2023: Number(row.history2023),
        history2024: Number(row.history2024),
        forecast2025: forecast.forecast2025,
        adjustedForecast2025: adjusted2025,
        approvedForecast2025: adjusted2025,
        percentChange2025:
          Number(row.history2024) === 0 ? 0 :
          Number((((adjusted2025 - row.history2024) / row.history2024) * 100).toFixed(1)),
        history2024_2026: Number(row.history2024),
        history2025_2026: Number(row.history2025),
        forecast2026: forecast.forecast2026,
        adjustedForecast2026: adjusted2026,
        approvedForecast2026: adjusted2026,
        percentChange2026:
          Number(row.history2025) === 0 ? 0 :
          Number((((adjusted2026 - row.history2025) / row.history2025) * 100).toFixed(1)),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ Failed in /api/final-forecast-report:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Express route for monthly breakdown
app.get('/api/final-forecast-report/monthly', async (req, res) => {
  const { item, year } = req.query;
  if (!item) return res.status(400).json({ error: 'Missing item' });

  try {
    const client = await pool.connect();

    const months = [];
    const start = new Date('2023-01-01');
    const end = new Date('2027-01-01');
    while (start <= end) {
      const y = start.getFullYear();
      const m = `${start.getMonth() + 1}`.padStart(2, '0');
      months.push(`${y}-${m}`);
      start.setMonth(start.getMonth() + 1);
    }

    const origQuery = await client.query(`
      SELECT 
        TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM') AS month,
        "VALUE_NUMBER"
      FROM forecast_original
      WHERE "PRD_LVL_MEMBER_NAME" = $1
    `, [item]);

    // First, get the column names from the forecast_result table
    const columnQuery = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'forecast_result' 
      AND column_name NOT IN ('PRD_LVL_MEMBER_NAME', 'TIM_LVL_MEMBER_VALUE')
      ORDER BY ordinal_position
    `);
    
    // Use the actual database column name for SQL queries, but always display "Klug Forecast AI"
    const actualColumnName = columnQuery.rows[0]?.column_name || 'Klug Forecast AI';
    const forecastColumnName = 'Klug Forecast AI'; // Always display this name on frontend
    
    const forecastQuery = await client.query(`
      SELECT 
        TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM') AS month,
        "${actualColumnName}"
      FROM forecast_result
      WHERE "PRD_LVL_MEMBER_NAME" = $1
    `, [item]);

    client.release();

    const origMap = new Map();
    origQuery.rows.forEach(r => origMap.set(r.month, r.VALUE_NUMBER));

    const forecastMap = new Map();
    forecastQuery.rows.forEach(r => forecastMap.set(r.month, r[actualColumnName]));

    const buildRow = (month: string, year: number): any => {
      const history2YMonth = `${year - 2}-${month.slice(5)}`;
      const history1YMonth = `${year - 1}-${month.slice(5)}`;

      const history2Y = Number(origMap.get(history2YMonth)) || 0;
      const history1Y = Number(origMap.get(history1YMonth)) || 0;
      const forecast = Number(forecastMap.get(month)) || 0;
      const adjustedForecast = forecast * 1.05;
      const approvedForecast = adjustedForecast;
      const percentChange = history2Y === 0 ? 0 : Number((((approvedForecast - history2Y) / history2Y) * 100).toFixed(1));


      return {
        date: month,
        history2Y,
        history1Y,
        forecast,
        adjustedForecast,
        approvedForecast,
        percentChange
      };
    };

    const monthly2025 = months
      .filter(m => m.startsWith('2025'))
      .map(m => buildRow(m, 2025));

    const monthly2026 = months
      .filter(m => m.startsWith('2026'))
      .map(m => buildRow(m, 2026));

    // Support legacy single-year request
    if (year === '2025') return res.json(monthly2025);
    if (year === '2026') return res.json(monthly2026);

    // Default: return merged result for both
    return res.json({ monthly2025, monthly2026 });

  } catch (err) {
    console.error('❌ Error in /api/final-forecast-report/monthly:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Business Level Booking Forecast Report (using inital_db and forecast_final)
app.get('/api/business-level-forecast-report', async (req, res) => {
  try {
    const { customerClassCode } = req.query;
    const client = await pool.connect();

    // Build filter for Customer Class Code if provided
    let filter = '';
    let params: any[] = [];
    if (customerClassCode) {
      filter = 'WHERE f."Customer Class Code" = $1';
      params.push(String(customerClassCode));
    }

    // Get individual items with their Business Unit, Family, Subfamily, and Color information
    const individualItemsQuery = `
      SELECT 
        f."PRD_LVL_MEMBER_NAME" AS item,
        f."Color" AS color,
        f."Subfamily" AS subfamily,
        f."Family" AS family,
        f."Business Unit" AS business_unit,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2023 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2023,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2024 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2024,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2025 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM f."TIM_LVL_MEMBER_VALUE"::date) = 2026 THEN f."VALUE_NUMBER" ELSE 0 END) AS history2026
      FROM inital_db f
      ${filter}
      GROUP BY f."PRD_LVL_MEMBER_NAME", f."Color", f."Subfamily", f."Family", f."Business Unit"
    `;

    const individualItems = await client.query(individualItemsQuery, params);

    // Get items that match the Customer Class Code filter for forecast data
    let itemFilter = '';
    if (customerClassCode) {
      itemFilter = `WHERE t."PRD_LVL_MEMBER_NAME" IN (
        SELECT DISTINCT "PRD_LVL_MEMBER_NAME" 
        FROM inital_db 
        WHERE "Customer Class Code" = $1
      )`;
    }

    // First, get the column names from the forecast_final table
    const columnQuery = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'forecast_final' 
      AND column_name NOT IN ('PRD_LVL_MEMBER_NAME', 'TIM_LVL_MEMBER_VALUE')
      ORDER BY ordinal_position
    `);
    
    // Use the actual database column name for SQL queries, but always display "Klug Forecast AI"
    const actualColumnName = columnQuery.rows[0]?.column_name || 'Klug Forecast AI';
    const forecastColumnName = 'Klug Forecast AI'; // Always display this name on frontend
    
    // Forecasts from forecast_final - filter by items that match Customer Class Code
    const resultForecast = await client.query(`
      SELECT 
        t."PRD_LVL_MEMBER_NAME" AS item,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2025 THEN t."${actualColumnName}" ELSE 0 END) AS forecast2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2026 THEN t."${actualColumnName}" ELSE 0 END) AS forecast2026
      FROM forecast_final t
      ${itemFilter}
      GROUP BY t."PRD_LVL_MEMBER_NAME"
    `, params);

    client.release();

    // Map forecast data
    const forecastMap = new Map();
    for (const row of resultForecast.rows) {
      forecastMap.set(row.item, {
        forecast2025: Number(row.forecast2025),
        forecast2026: Number(row.forecast2026),
      });
    }

    // Process individual items
    const individualData = individualItems.rows.map((row) => {
      const forecast = forecastMap.get(row.item) || { forecast2025: 0, forecast2026: 0 };
      const adjusted2025 = forecast.forecast2025 * 1.05;
      const adjusted2026 = forecast.forecast2026 * 1.05;

      return {
        item: row.item,
        color: row.color,
        subfamily: row.subfamily,
        family: row.family,
        business_unit: row.business_unit,
        history2023: Number(row.history2023),
        history2024: Number(row.history2024),
        forecast2025: forecast.forecast2025,
        adjustedForecast2025: adjusted2025,
        approvedForecast2025: adjusted2025,
        percentChange2025:
          Number(row.history2024) === 0 ? 0 :
          Number((((adjusted2025 - row.history2024) / row.history2024) * 100).toFixed(1)),
        history2024_2026: Number(row.history2024),
        history2025_2026: Number(row.history2025),
        forecast2026: forecast.forecast2026,
        adjustedForecast2026: adjusted2026,
        approvedForecast2026: adjusted2026,
        percentChange2026:
          Number(row.history2025) === 0 ? 0 :
          Number((((adjusted2026 - row.history2025) / row.history2025) * 100).toFixed(1)),
      };
    });

    // Group by Color
    const colorGroups = new Map();
    individualData.forEach(item => {
      const colorKey = `${item.business_unit}||${item.family}||${item.subfamily}||${item.color}`;
      if (!colorGroups.has(colorKey)) {
        colorGroups.set(colorKey, {
          color: item.color,
          subfamily: item.subfamily,
          family: item.family,
          business_unit: item.business_unit,
          isColorGroup: true,
          children: [],
          history2023: 0,
          history2024: 0,
          forecast2025: 0,
          adjustedForecast2025: 0,
          approvedForecast2025: 0,
          percentChange2025: 0,
          history2024_2026: 0,
          history2025_2026: 0,
          forecast2026: 0,
          adjustedForecast2026: 0,
          approvedForecast2026: 0,
          percentChange2026: 0,
        });
      }
      const group = colorGroups.get(colorKey);
      group.children.push(item);
      group.history2023 += item.history2023;
      group.history2024 += item.history2024;
      group.forecast2025 += item.forecast2025;
      group.adjustedForecast2025 += item.adjustedForecast2025;
      group.approvedForecast2025 += item.approvedForecast2025;
      group.history2024_2026 += item.history2024_2026;
      group.history2025_2026 += item.history2025_2026;
      group.forecast2026 += item.forecast2026;
      group.adjustedForecast2026 += item.adjustedForecast2026;
      group.approvedForecast2026 += item.approvedForecast2026;
    });
    colorGroups.forEach(group => {
      group.percentChange2025 = group.history2024 === 0 ? 0 :
        Number((((group.adjustedForecast2025 - group.history2024) / group.history2024) * 100).toFixed(1));
      group.percentChange2026 = group.history2025_2026 === 0 ? 0 :
        Number((((group.adjustedForecast2026 - group.history2025_2026) / group.history2025_2026) * 100).toFixed(1));
    });

    // Group by Subfamily
    const subfamilyGroups = new Map();
    colorGroups.forEach(colorGroup => {
      const subKey = `${colorGroup.business_unit}||${colorGroup.family}||${colorGroup.subfamily}`;
      if (!subfamilyGroups.has(subKey)) {
        subfamilyGroups.set(subKey, {
          subfamily: colorGroup.subfamily,
          family: colorGroup.family,
          business_unit: colorGroup.business_unit,
          isSubfamilyGroup: true,
          children: [],
          history2023: 0,
          history2024: 0,
          forecast2025: 0,
          adjustedForecast2025: 0,
          approvedForecast2025: 0,
          percentChange2025: 0,
          history2024_2026: 0,
          history2025_2026: 0,
          forecast2026: 0,
          adjustedForecast2026: 0,
          approvedForecast2026: 0,
          percentChange2026: 0,
        });
      }
      const subGroup = subfamilyGroups.get(subKey);
      subGroup.children.push(colorGroup);
      subGroup.history2023 += colorGroup.history2023;
      subGroup.history2024 += colorGroup.history2024;
      subGroup.forecast2025 += colorGroup.forecast2025;
      subGroup.adjustedForecast2025 += colorGroup.adjustedForecast2025;
      subGroup.approvedForecast2025 += colorGroup.approvedForecast2025;
      subGroup.history2024_2026 += colorGroup.history2024_2026;
      subGroup.history2025_2026 += colorGroup.history2025_2026;
      subGroup.forecast2026 += colorGroup.forecast2026;
      subGroup.adjustedForecast2026 += colorGroup.adjustedForecast2026;
      subGroup.approvedForecast2026 += colorGroup.approvedForecast2026;
    });
    subfamilyGroups.forEach(subGroup => {
      subGroup.percentChange2025 = subGroup.history2024 === 0 ? 0 :
        Number((((subGroup.adjustedForecast2025 - subGroup.history2024) / subGroup.history2024) * 100).toFixed(1));
      subGroup.percentChange2026 = subGroup.history2025_2026 === 0 ? 0 :
        Number((((subGroup.adjustedForecast2026 - subGroup.history2025_2026) / subGroup.history2025_2026) * 100).toFixed(1));
    });

    // Group by Family
    const familyGroups = new Map();
    subfamilyGroups.forEach(subGroup => {
      const famKey = `${subGroup.business_unit}||${subGroup.family}`;
      if (!familyGroups.has(famKey)) {
        familyGroups.set(famKey, {
          family: subGroup.family,
          business_unit: subGroup.business_unit,
          isFamilyGroup: true,
          children: [],
          history2023: 0,
          history2024: 0,
          forecast2025: 0,
          adjustedForecast2025: 0,
          approvedForecast2025: 0,
          percentChange2025: 0,
          history2024_2026: 0,
          history2025_2026: 0,
          forecast2026: 0,
          adjustedForecast2026: 0,
          approvedForecast2026: 0,
          percentChange2026: 0,
        });
      }
      const famGroup = familyGroups.get(famKey);
      famGroup.children.push(subGroup);
      famGroup.history2023 += subGroup.history2023;
      famGroup.history2024 += subGroup.history2024;
      famGroup.forecast2025 += subGroup.forecast2025;
      famGroup.adjustedForecast2025 += subGroup.adjustedForecast2025;
      famGroup.approvedForecast2025 += subGroup.approvedForecast2025;
      famGroup.history2024_2026 += subGroup.history2024_2026;
      famGroup.history2025_2026 += subGroup.history2025_2026;
      famGroup.forecast2026 += subGroup.forecast2026;
      famGroup.adjustedForecast2026 += subGroup.adjustedForecast2026;
      famGroup.approvedForecast2026 += subGroup.approvedForecast2026;
    });
    familyGroups.forEach(famGroup => {
      famGroup.percentChange2025 = famGroup.history2024 === 0 ? 0 :
        Number((((famGroup.adjustedForecast2025 - famGroup.history2024) / famGroup.history2024) * 100).toFixed(1));
      famGroup.percentChange2026 = famGroup.history2025_2026 === 0 ? 0 :
        Number((((famGroup.adjustedForecast2026 - famGroup.history2025_2026) / famGroup.history2025_2026) * 100).toFixed(1));
    });

    // Group by Business Unit
    const businessUnitGroups = new Map();
    familyGroups.forEach(famGroup => {
      const buKey = famGroup.business_unit;
      if (!businessUnitGroups.has(buKey)) {
        businessUnitGroups.set(buKey, {
          business_unit: famGroup.business_unit,
          isBusinessUnitGroup: true,
          children: [],
          history2023: 0,
          history2024: 0,
          forecast2025: 0,
          adjustedForecast2025: 0,
          approvedForecast2025: 0,
          percentChange2025: 0,
          history2024_2026: 0,
          history2025_2026: 0,
          forecast2026: 0,
          adjustedForecast2026: 0,
          approvedForecast2026: 0,
          percentChange2026: 0,
        });
      }
      const buGroup = businessUnitGroups.get(buKey);
      buGroup.children.push(famGroup);
      buGroup.history2023 += famGroup.history2023;
      buGroup.history2024 += famGroup.history2024;
      buGroup.forecast2025 += famGroup.forecast2025;
      buGroup.adjustedForecast2025 += famGroup.adjustedForecast2025;
      buGroup.approvedForecast2025 += famGroup.approvedForecast2025;
      buGroup.history2024_2026 += famGroup.history2024_2026;
      buGroup.history2025_2026 += famGroup.history2025_2026;
      buGroup.forecast2026 += famGroup.forecast2026;
      buGroup.adjustedForecast2026 += famGroup.adjustedForecast2026;
      buGroup.approvedForecast2026 += famGroup.approvedForecast2026;
    });
    businessUnitGroups.forEach(buGroup => {
      buGroup.percentChange2025 = buGroup.history2024 === 0 ? 0 :
        Number((((buGroup.adjustedForecast2025 - buGroup.history2024) / buGroup.history2024) * 100).toFixed(1));
      buGroup.percentChange2026 = buGroup.history2025_2026 === 0 ? 0 :
        Number((((buGroup.adjustedForecast2026 - buGroup.history2025_2026) / buGroup.history2025_2026) * 100).toFixed(1));
    });

    // Return nested structure
    const result = Array.from(businessUnitGroups.values());
    res.json(result);
  } catch (err) {
    console.error('❌ Failed in /api/business-level-forecast-report:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Monthly breakdown for Business Level Booking Forecast
app.get('/api/business-level-forecast-report/monthly', async (req, res) => {
  const { item, year, customerClassCode } = req.query;
  if (!item) return res.status(400).json({ error: 'Missing item' });

  try {
    const client = await pool.connect();

    const months: string[] = [];
    const start = new Date('2023-01-01');
    const end = new Date('2027-01-01');
    while (start <= end) {
      const y = start.getFullYear();
      const m = `${start.getMonth() + 1}`.padStart(2, '0');
      months.push(`${y}-${m}`);
      start.setMonth(start.getMonth() + 1);
    }

    // Build filter for Customer Class Code if provided
    let filter = 'WHERE "PRD_LVL_MEMBER_NAME" = $1';
    let params: any[] = [String(item)];
    if (customerClassCode) {
      filter += ' AND "Customer Class Code" = $2';
      params.push(String(customerClassCode));
    }

    const origQuery = await client.query(`
      SELECT 
        TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM') AS month,
        "VALUE_NUMBER"
      FROM inital_db
      ${filter}
    `, params);

    // For forecast_final, we need to check if the item has the specified Customer Class Code
    let forecastFilter = 'WHERE "PRD_LVL_MEMBER_NAME" = $1';
    let forecastParams: any[] = [String(item)];
    if (customerClassCode) {
      // Check if this item has the specified Customer Class Code in inital_db
      const itemCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM inital_db
        WHERE "PRD_LVL_MEMBER_NAME" = $1 AND "Customer Class Code" = $2
      `, [String(item), String(customerClassCode)]);
      
      if (itemCheck.rows[0].count === '0') {
        // Item doesn't have this Customer Class Code, return empty results
        client.release();
        return res.json({ monthly2025: [], monthly2026: [] });
      }
    }

    // First, get the column names from the forecast_final table
    const columnQuery = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'forecast_final' 
      AND column_name NOT IN ('PRD_LVL_MEMBER_NAME', 'TIM_LVL_MEMBER_VALUE')
      ORDER BY ordinal_position
    `);
    
    // Use the actual database column name for SQL queries, but always display "Klug Forecast AI"
    const actualColumnName = columnQuery.rows[0]?.column_name || 'Klug Forecast AI';
    const forecastColumnName = 'Klug Forecast AI'; // Always display this name on frontend
    
    const forecastQuery = await client.query(`
      SELECT 
        TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM') AS month,
        "${actualColumnName}"
      FROM forecast_final
      ${forecastFilter}
    `, forecastParams);

    client.release();

    const origMap = new Map();
    origQuery.rows.forEach(r => origMap.set(r.month, r.VALUE_NUMBER));

    const forecastMap = new Map();
    forecastQuery.rows.forEach(r => forecastMap.set(r.month, r[actualColumnName]));

    const buildRow = (month: string, year: number): any => {
      const history2YMonth = `${year - 2}-${month.slice(5)}`;
      const history1YMonth = `${year - 1}-${month.slice(5)}`;

      const history2Y = Number(origMap.get(history2YMonth)) || 0;
      const history1Y = Number(origMap.get(history1YMonth)) || 0;
      const forecast = Number(forecastMap.get(month)) || 0;
      const adjustedForecast = forecast * 1.05;
      const approvedForecast = adjustedForecast;
      const percentChange = history2Y === 0 ? 0 : Number((((approvedForecast - history2Y) / history2Y) * 100).toFixed(1));


      return {
        date: month,
        history2Y,
        history1Y,
        forecast,
        adjustedForecast,
        approvedForecast,
        percentChange
      };
    };

    const monthly2025 = months
      .filter(m => m.startsWith('2025'))
      .map(m => buildRow(m, 2025));

    const monthly2026 = months
      .filter(m => m.startsWith('2026'))
      .map(m => buildRow(m, 2026));

    // Support legacy single-year request
    if (year === '2025') return res.json(monthly2025);
    if (year === '2026') return res.json(monthly2026);

    // Default: return merged result for both
    return res.json({ monthly2025, monthly2026 });

  } catch (err) {
    console.error('❌ Error in /api/business-level-forecast-report/monthly:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint to list files in Forecast_Result folder
app.get('/api/list-forecast-results', async (_req, res) => {
  try {
    const data = await s3Result.listObjectsV2({
      Bucket: FORECAST_RESULT_BUCKET,
      Prefix: FORECAST_RESULT_PREFIX,
    }).promise();
    const files = (data.Contents || []).map(obj => ({
      key: obj.Key!,
      name: obj.Key?.split('/').pop(),
      owner: 'ForecastAI',
      status: 'Active',
    }));
    res.json(files);
  } catch (err) {
    console.error('[List Forecast Results Error]', err);
    res.status(500).json({ error: 'Failed to list forecast result files' });
  }
});

// Endpoint to preview a forecast result file
app.get('/api/preview-forecast-result', async (req, res) => {
  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: 'Missing key' });
  try {
    const data = await s3Result.getObject({
      Bucket: FORECAST_RESULT_BUCKET,
      Key: key,
    }).promise();
    
    // Convert buffer to string and replace TimeGPT with Klug Forecast AI
    const csvBuffer = data.Body as Buffer;
    const csvContent = csvBuffer.toString();
    const modifiedContent = csvContent.replace(/TimeGPT/g, 'Klug Forecast AI');
    
    res.setHeader('Content-Type', 'text/csv');
    res.send(modifiedContent);
  } catch (err) {
    console.error('[Preview Forecast Result Error]', err);
    res.status(500).json({ error: 'Failed to preview forecast result file' });
  }
});

// Endpoint to delete a forecast result file
app.delete('/api/delete-forecast-result', async (req, res) => {
  const key = req.query.key as string;
  if (!key) return res.status(400).json({ error: 'Missing key' });
  try {
    await s3Result.deleteObject({
      Bucket: FORECAST_RESULT_BUCKET,
      Key: key,
    }).promise();
    res.json({ message: 'Forecast result file deleted' });
  } catch (err) {
    console.error('[Delete Forecast Result Error]', err);
    res.status(500).json({ error: 'Failed to delete forecast result file' });
  }
});

// Endpoint to duplicate a forecast result file with a new name
app.post('/api/duplicate-forecast-result', async (req, res) => {
  const { sourceKey, newName } = req.body;
  if (!sourceKey || !newName) {
    return res.status(400).json({ error: 'Missing sourceKey or newName' });
  }
  try {
    const s3 = s3Result;
    const targetKey = FORECAST_RESULT_PREFIX + newName;
    await s3.copyObject({
      Bucket: FORECAST_RESULT_BUCKET,
      CopySource: `/${FORECAST_RESULT_BUCKET}/${sourceKey}`,
      Key: targetKey,
    }).promise();
    res.json({ message: 'Forecast result file duplicated', newKey: targetKey });
  } catch (err) {
    console.error('[Duplicate Forecast Result Error]', err);
    res.status(500).json({ error: 'Failed to duplicate forecast result file' });
  }
});

// Add endpoint to clear forecast tables
app.post('/api/clear-forecast-tables', async (_req, res) => {
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE "forecast_original"');
    await client.query('TRUNCATE "forecast_result"');
    res.status(200).json({ message: 'Forecast tables cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear forecast tables' });
  } finally {
    client.release();
  }
});

// Endpoint to upload forecast result to S3 (to avoid CORS issues)
app.post('/api/upload-forecast-result', async (req, res) => {
  try {
    const { key, data } = req.body;
    
    if (!key || !data) {
      return res.status(400).json({ error: 'Missing key or data' });
    }

    const s3 = new AWS.S3({
      region: 'us-east-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    // Replace "TimeGPT" with "Klug Forecast AI" in the CSV data
    const modifiedData = data.replace(/TimeGPT/g, 'Klug Forecast AI');

    const uploadParams = {
      Bucket: FORECAST_RESULT_BUCKET,
      Key: key,
      Body: modifiedData,
      ContentType: 'text/csv',
    };

    await s3.upload(uploadParams).promise();
    
    res.json({ message: 'Forecast result uploaded successfully with Klug Forecast AI branding' });
  } catch (err) {
    console.error('[Upload Forecast Result Error]', err);
    res.status(500).json({ error: 'Failed to upload forecast result' });
  }
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
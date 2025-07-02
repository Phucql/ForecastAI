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

import { mergeForecastFiles } from './utils/mergeForecastFiles.js';


process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

const upload = multer({ dest: 'uploads/' });
const { Pool } = pkg;
const app = express();
const port = 3001;

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



const requiredEnvVars = ['VITE_DB_HOST', 'VITE_DB_NAME', 'VITE_DB_USER', 'VITE_DB_PASSWORD'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
const parseS3Csv = async (bucket: string, key: string): Promise<any[]> => {
  const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  const csvContent = data.Body?.toString('utf-8');

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
    await client.query(`TRUNCATE "${table}"`);
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

  if (!originalKey || !forecastKey) {
    return res.status(400).json({ error: 'Missing originalKey or forecastKey' });
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

    const originalRows = parseDateField(await parseS3Csv(bucket, originalKey));
    const forecastRows = parseDateField(await parseS3Csv(bucket, forecastKey));

    await insertRows('forecast_original', originalRows);
    await insertRows('forecast_result', forecastRows);

    console.log('✅ Data uploaded to forecast_original and forecast_result');
    res.status(200).json({ message: 'Data uploaded to forecast_original and forecast_result' });
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

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:4173',
    'https://foodforecastai.netlify.app',
    process.env.CORS_ORIGIN
  ].filter((origin): origin is string => Boolean(origin)),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

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

    const csvContent = data.Body?.toString('utf-8');
    if (!csvContent) throw new Error('Empty CSV content');

    res.send(csvContent);
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
    const csvContent = data.Body?.toString('utf-8');
    res.header('Content-Type', 'text/csv');
    res.send(csvContent);
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

app.post('/api/run-forecast-py', async (req, res) => {
  const { id, time, target, PRD_LVL_MEMBER_NAME, originalFileName } = req.body;

  if (!time || !target || !Array.isArray(time) || !Array.isArray(target)) {
    return res.status(400).json({ error: 'Missing or invalid `time` or `target` arrays in request body.' });
  }

  if (!PRD_LVL_MEMBER_NAME || !Array.isArray(PRD_LVL_MEMBER_NAME)) {
    return res.status(400).json({ error: 'Missing or invalid `PRD_LVL_MEMBER_NAME` array in request body.' });
  }

  if (time.length !== target.length || time.length !== PRD_LVL_MEMBER_NAME.length) {
    return res.status(400).json({ error: 'Arrays `time`, `target`, and `PRD_LVL_MEMBER_NAME` must have the same length.' });
  }

  const series = time.map((t, i) => ({ 
    time: t, 
    target: target[i], 
    PRD_LVL_MEMBER_NAME: PRD_LVL_MEMBER_NAME[i] 
  }));
  const payload = {
    id,
    series,
    horizon: req.body.horizon,
    api_key: process.env.TIMEGPT_API_KEY
  };

  // Use a configurable Python path for deployment friendliness
  const pythonPath = process.env.PYTHON_PATH || 'python3';
  console.log(`[Forecast] Using Python executable: ${pythonPath}`);
  const py = spawn(
    pythonPath,
    ['src/forecast_runner.py', JSON.stringify(payload)]
  );
  console.log('[Forecast] Spawned Python process for forecast_runner.py');

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
    console.log('[PYTHON RAW STDOUT]', result);
    console.log('[PYTHON RAW STDERR]', error);

    if (error) {
      return res.status(500).json({ error });
    }

    try {
      const parsed = JSON.parse(result);
      const forecastCsv = Papa.unparse(parsed);

      // Use originalFileName from request, fallback to id or 'forecast_file'
      const baseFileName = originalFileName || id || 'forecast_file';
      const originalKey = `forecasts/${baseFileName}.csv`;
      const today = new Date().toISOString().slice(0, 10);

      // New format: Forecast_<OriginalFileName>_<date>.csv
      const forecastFileName = `forecasts/Forecast_${baseFileName}_${today}.csv`;
      const mergedKey = `forecasts/${baseFileName}_merged_${today}.csv`;

      await s3.upload({
        Bucket: process.env.VITE_S3_BUCKET_NAME!,
        Key: forecastFileName,
        Body: forecastCsv,
        ContentType: 'text/csv',
        Metadata: {
          owner: 'ForecastAI',
          status: 'Active',
          description: `Forecast generated for ${baseFileName}.csv on ${today}`
        }
      }).promise();

      console.log(`[UPLOAD SUCCESS] Forecast uploaded: ${forecastFileName}`);

      const originalCsv = await waitForObject(originalKey);
      const forecastCsvFromS3 = await waitForObject(forecastFileName);

      // Use chardet to detect encoding for original and forecast CSVs
      const originalBuffer = originalCsv.Body as Buffer;
      const originalEncoding = mapChardetToNodeEncoding(chardet.detect(originalBuffer));
      const originalCsvString = originalBuffer.toString(originalEncoding);

      const forecastBuffer = forecastCsvFromS3.Body as Buffer;
      const forecastEncoding = mapChardetToNodeEncoding(chardet.detect(forecastBuffer));
      const forecastCsvString = forecastBuffer.toString(forecastEncoding);

      const mergedCsv = mergeForecastFiles(
        originalCsvString,
        forecastCsvString
      );

      await s3.upload({
        Bucket: process.env.VITE_S3_BUCKET_NAME!,
        Key: mergedKey,
        Body: mergedCsv,
        ContentType: 'text/csv',
        Metadata: {
          owner: 'ForecastAI',
          status: 'Final',
          description: `Merged file for ${baseFileName}.csv with forecast ${forecastFileName}`
        }
      }).promise();

      console.log(`[MERGE UPLOAD SUCCESS] Merged file uploaded: ${mergedKey}`);

      res.json({
        message: 'Forecast and merge complete',
        forecastFile: forecastFileName,
        mergedFile: mergedKey,
        result: parsed
      });

    } catch (parseErr) {
      console.error("❌ Failed to parse or merge:", parseErr);
      res.status(500).json({ error: "Failed to parse or merge", details: result });
    }
  });
});



app.post('/api/merge-forecast-files', async (req, res) => {
  const { originalKey, forecastKey } = req.body;
  console.log('[DEBUG] Incoming keys:', originalKey, forecastKey);


  if (!originalKey || !forecastKey) {
    return res.status(400).json({ error: 'Missing originalKey or forecastKey' });
  }

  try {
    const originalCsv = await waitForObject(originalKey);
    const forecastCsv = await waitForObject(forecastKey);


    const mergedCsv = mergeForecastFiles(
      originalCsv.Body!.toString('utf-8'),
      forecastCsv.Body!.toString('utf-8')
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

        const csvContent = obj.Body!.toString('utf-8');
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

    // Forecasts from forecast_result
    const resultForecast = await client.query(`
      SELECT 
        t."PRD_LVL_MEMBER_NAME" AS item,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2025 THEN t."TimeGPT" ELSE 0 END) AS forecast2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2026 THEN t."TimeGPT" ELSE 0 END) AS forecast2026
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

    const forecastQuery = await client.query(`
      SELECT 
        TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM') AS month,
        "TimeGPT"
      FROM forecast_result
      WHERE "PRD_LVL_MEMBER_NAME" = $1
    `, [item]);

    client.release();

    const origMap = new Map();
    origQuery.rows.forEach(r => origMap.set(r.month, r.VALUE_NUMBER));

    const forecastMap = new Map();
    forecastQuery.rows.forEach(r => forecastMap.set(r.month, r.TimeGPT));

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

    // Forecasts from forecast_final - filter by items that match Customer Class Code
    const resultForecast = await client.query(`
      SELECT 
        t."PRD_LVL_MEMBER_NAME" AS item,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2025 THEN t."TimeGPT" ELSE 0 END) AS forecast2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM t."TIM_LVL_MEMBER_VALUE"::date) = 2026 THEN t."TimeGPT" ELSE 0 END) AS forecast2026
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

    const forecastQuery = await client.query(`
      SELECT 
        TO_CHAR("TIM_LVL_MEMBER_VALUE", 'YYYY-MM') AS month,
        "TimeGPT"
      FROM forecast_final
      ${forecastFilter}
    `, forecastParams);

    client.release();

    const origMap = new Map();
    origQuery.rows.forEach(r => origMap.set(r.month, r.VALUE_NUMBER));

    const forecastMap = new Map();
    forecastQuery.rows.forEach(r => forecastMap.set(r.month, r.TimeGPT));

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
      .filter((m: string) => m.startsWith('2025'))
      .map((m: string) => buildRow(m, 2025));

    const monthly2026 = months
      .filter((m: string) => m.startsWith('2026'))
      .map((m: string) => buildRow(m, 2026));

    // Support legacy single-year request
    if (String(year) === '2025') return res.json(monthly2025);
    if (String(year) === '2026') return res.json(monthly2026);

    // Default: return merged result for both
    return res.json({ monthly2025, monthly2026 });

  } catch (err) {
    console.error('❌ Error in /api/business-level-forecast-report/monthly:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

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

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});



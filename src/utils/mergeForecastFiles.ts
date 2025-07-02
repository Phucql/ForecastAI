// mergeForecastFiles.ts
import Papa from 'papaparse';
import AWS from 'aws-sdk';
import chardet from 'chardet';

const s3 = new AWS.S3({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  }
});

export const mergeForecastFiles = async (originalKey: string, forecastKey: string): Promise<string> => {
  const bucket = process.env.VITE_S3_BUCKET_NAME!;

  const [originalData, forecastData] = await Promise.all([
    s3.getObject({ Bucket: bucket, Key: originalKey }).promise(),
    s3.getObject({ Bucket: bucket, Key: forecastKey }).promise(),
  ]);

  // Detect encoding for original CSV
  const originalBuffer = originalData.Body as Buffer;
  const originalEncoding = chardet.detect(originalBuffer) || 'utf-8';
  const originalCsv = originalBuffer.toString(originalEncoding as BufferEncoding);

  // Detect encoding for forecast CSV
  const forecastBuffer = forecastData.Body as Buffer;
  const forecastEncoding = chardet.detect(forecastBuffer) || 'utf-8';
  const forecastCsv = forecastBuffer.toString(forecastEncoding as BufferEncoding);

  const original = Papa.parse(originalCsv, { header: true }).data as any[];
  const forecast = Papa.parse(forecastCsv, { header: true }).data as any[];

  const merged = original.map(row => {
    const match = forecast.find(f =>
      f.PRD_LVL_MEMBER_NAME === row.PRD_LVL_MEMBER_NAME &&
      f.TIM_LVL_MEMBER_VALUE === row.TIM_LVL_MEMBER_VALUE
    );

    return {
      ...row,
      ForecastAI: match ? match.ForecastAI : ''
    };
  });

  return Papa.unparse(merged, { quotes: true });
};

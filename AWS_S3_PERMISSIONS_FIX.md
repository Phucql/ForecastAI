# AWS S3 CORS Configuration Fix

## Problem
The application was experiencing CORS (Cross-Origin Resource Sharing) errors when trying to upload forecast results directly to S3 from the browser:

```
Access to fetch at 'https://forecastai-file-upload.s3.us-east-2.amazonaws.com/Forecast_Result/liveforecast%201_forecast_2025-07-24.csv?x-id=PutObject' from origin 'https://foodforecastai.netlify.app' has been blocked by CORS policy
```

## Solution
Instead of uploading directly to S3 from the browser (which requires complex CORS configuration), the application now uploads through the backend server, which avoids CORS issues entirely.

### Changes Made:

1. **Frontend (`src/App.tsx`)**:
   - Removed direct S3 client usage (`S3Client`, `PutObjectCommand`)
   - Added new API call to `/api/upload-forecast-result` endpoint
   - Fixed `ReferenceError: fetchForecastFiles is not defined` by using correct function name `fetchSavedForecasts`

2. **Backend (`src/server.ts`)**:
   - Added new endpoint `/api/upload-forecast-result` to handle S3 uploads server-side
   - This endpoint receives the CSV data and uploads it to S3 using AWS SDK

## Alternative: S3 CORS Configuration (if direct upload is needed)

If you need to enable direct S3 uploads from the browser in the future, you can configure CORS on your S3 bucket:

### S3 CORS Configuration JSON:
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://foodforecastai.netlify.app",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### How to Apply:
1. Go to AWS S3 Console
2. Select your bucket (`forecastai-file-upload`)
3. Go to "Permissions" tab
4. Scroll down to "Cross-origin resource sharing (CORS)"
5. Click "Edit" and paste the above JSON
6. Click "Save changes"

## Benefits of Current Solution:
- ✅ No CORS configuration needed
- ✅ Better security (AWS credentials stay on server)
- ✅ Simpler error handling
- ✅ Works with any origin without configuration changes

## Files Modified:
- `src/App.tsx` - Removed direct S3 upload, fixed function reference
- `src/server.ts` - Added upload endpoint
- `AWS_S3_PERMISSIONS_FIX.md` - This documentation file 
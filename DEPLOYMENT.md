# Deployment Guide for ForecastAI

## Architecture Overview

- **Frontend**: Netlify (https://foodforecastai.netlify.app)
- **Backend**: Render (Node.js/Express)
- **Database**: AWS PostgreSQL
- **Storage**: AWS S3

## Environment Configuration

### Frontend (.env file)
```bash
VITE_API_BASE_URL=https://foodforecastai.netlify.app
```

### Backend Environment Variables (Render)
Set these in your Render dashboard:
- `VITE_DB_HOST` - Your AWS PostgreSQL host
- `VITE_DB_NAME` - Database name
- `VITE_DB_USER` - Database username
- `VITE_DB_PASSWORD` - Database password
- `VITE_AWS_ACCESS_KEY_ID` - AWS access key
- `VITE_AWS_SECRET_ACCESS_KEY` - AWS secret key
- `VITE_AWS_REGION` - AWS region (e.g., us-east-2)
- `VITE_S3_BUCKET_NAME` - S3 bucket name
- `CORS_ORIGIN` - https://foodforecastai.netlify.app
- `PORT` - 3001

## Frontend Deployment (Netlify)

### Build Configuration
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18

### Netlify Configuration (netlify.toml)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-render-backend-url.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Important**: Replace `https://your-render-backend-url.onrender.com` with your actual Render backend URL.

## Backend Deployment (Render)

### Build Process

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the server for production:**
   ```bash
   npm run build:prod
   ```

   This will:
   - Compile TypeScript server code to JavaScript
   - Create a `dist/` directory with compiled files
   - Generate a production `package.json` in the dist folder

### Render Configuration (render.yaml)
```yaml
services:
  - type: web
    name: forecastai
    env: node
    buildCommand: npm install && npm run build:prod
    startCommand: cd dist && npm install && npm start
    envVars:
      - key: NODE_VERSION
        value: 18
      - key: PORT
        value: 3001
      - key: CORS_ORIGIN
        value: https://foodforecastai.netlify.app
```

## Development vs Production

### Development
- Frontend: `npm run dev` (Vite dev server on localhost:5173)
- Backend: `npm run server` (TypeScript with ts-node on localhost:3001)
- Uses localhost proxy configuration

### Production
- Frontend: Netlify (built with `npm run build`)
- Backend: Render (compiled JavaScript)
- Uses environment variables for API URLs

## API Configuration

The application now uses environment variables for API endpoints:

- **Development**: Uses proxy to localhost:3001
- **Production**: Uses `VITE_API_BASE_URL` environment variable
- **Fallback**: Defaults to localhost:3001 if environment variable is not set

## Troubleshooting

1. **CORS Issues**: Ensure your Render backend has the correct CORS origin configured
2. **API Calls**: Verify `VITE_API_BASE_URL` is set correctly in your .env file
3. **Database Connection**: Ensure your AWS PostgreSQL is accessible from Render
4. **AWS Credentials**: Verify all AWS environment variables are set correctly in Render

## File Structure After Build

```
dist/
├── server.js              # Compiled server
├── utils/
│   └── mergeForecastFiles.js
├── package.json           # Production package.json
└── node_modules/          # Production dependencies
```

## Deployment Checklist

- [ ] Set all environment variables in Render
- [ ] Update netlify.toml with correct backend URL
- [ ] Ensure CORS is configured for Netlify domain
- [ ] Test API endpoints from frontend
- [ ] Verify database connectivity
- [ ] Check AWS S3 access 
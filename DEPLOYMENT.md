# Deployment Guide for Render

## Backend Deployment (Compiled JavaScript)

This guide explains how to deploy the backend to Render using compiled JavaScript.

### Prerequisites

- Node.js 18+ installed
- All environment variables configured
- Database connection ready

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

3. **Test the compiled version locally:**
   ```bash
   cd dist
   npm install
   npm start
   ```

### Render Configuration

#### Build Command
```bash
npm run build:prod
```

#### Start Command
```bash
cd dist && npm install && npm start
```

#### Environment Variables
Make sure to set these in Render:
- `VITE_DB_HOST`
- `VITE_DB_NAME`
- `VITE_DB_USER`
- `VITE_DB_PASSWORD`
- `VITE_AWS_ACCESS_KEY_ID`
- `VITE_AWS_SECRET_ACCESS_KEY`
- `VITE_AWS_REGION`
- `VITE_S3_BUCKET_NAME`

### File Structure After Build

```
dist/
├── server.js              # Compiled server
├── utils/
│   └── mergeForecastFiles.js
├── package.json           # Production package.json
└── node_modules/          # Production dependencies
```

### Troubleshooting

1. **Port Issues**: The server runs on port 3001 by default. Render will provide a `PORT` environment variable.

2. **Database Connection**: Ensure your database is accessible from Render's servers.

3. **AWS Credentials**: Verify all AWS environment variables are set correctly.

4. **CORS Issues**: Update CORS origins in `server.ts` to include your Render domain.

### Development vs Production

- **Development**: Uses `npm run server` (TypeScript with ts-node)
- **Production**: Uses `npm run server:prod` (Compiled JavaScript)

The compiled version is faster and more reliable for production deployment. 
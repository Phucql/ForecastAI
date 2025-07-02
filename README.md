"# forecastai" 
"# forecastai" 
"# forecastai" 
"# forecastai" 
"# forecastai" 
"# FoodAI" 
"# FoodAI" 
"# FoodAI" 
"# ForecastAI" 

# ForecastAI

A comprehensive forecasting application with demand planning, supply network modeling, and analytics capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS PostgreSQL database
- AWS S3 bucket
- AWS credentials

### Environment Setup

1. **Create `.env` file in the root directory:**
```bash
VITE_API_BASE_URL=https://foodforecastai.netlify.app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

## 🌐 Deployment

### Frontend (Netlify)
- **URL**: https://foodforecastai.netlify.app
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Backend (Render)
- **Build Command**: `npm run build:prod`
- **Start Command**: `cd dist && npm install && npm start`

### Environment Variables (Render)
Set these in your Render dashboard:
- `VITE_DB_HOST` - AWS PostgreSQL host
- `VITE_DB_NAME` - Database name
- `VITE_DB_USER` - Database username
- `VITE_DB_PASSWORD` - Database password
- `VITE_AWS_ACCESS_KEY_ID` - AWS access key
- `VITE_AWS_SECRET_ACCESS_KEY` - AWS secret key
- `VITE_AWS_REGION` - AWS region
- `VITE_S3_BUCKET_NAME` - S3 bucket name
- `CORS_ORIGIN` - https://foodforecastai.netlify.app

## 📚 Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Development

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Storage**: AWS S3
- **Styling**: Tailwind CSS

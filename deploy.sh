#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo "📁 Build output in dist/ directory"
    echo ""
    echo "🌐 To deploy to Netlify:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your repository to Netlify"
    echo "3. Set build command: npm run build"
    echo "4. Set publish directory: dist"
    echo "5. Add environment variable: VITE_API_BASE_URL=https://foodforecastai.netlify.app"
    echo ""
    echo "🔧 Don't forget to:"
    echo "- Update netlify.toml with your actual Render backend URL"
    echo "- Set all environment variables in Render dashboard"
    echo "- Configure CORS in your backend for https://foodforecastai.netlify.app"
else
    echo "❌ Frontend build failed!"
    exit 1
fi 
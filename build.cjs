#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Starting build process...');

// Build the frontend
console.log('📦 Building frontend...');
execSync('npm run build', { stdio: 'inherit' });

// Build the server
console.log('⚙️ Building server...');
execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });

// Copy Python files to dist
console.log('🐍 Copying Python files...');
const pythonFiles = [
  'src/forecast_runner.py',
  'requirements.txt',
  'test_render_python.py'
];

pythonFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const destPath = path.join('dist', path.basename(file));
    fs.copyFileSync(file, destPath);
    console.log(`✅ Copied ${file} to ${destPath}`);
  } else {
    console.warn(`⚠️ File not found: ${file}`);
  }
});

// Copy utils folder if it exists
const utilsSrc = 'src/utils';
const utilsDest = 'dist/utils';
if (fs.existsSync(utilsSrc)) {
  if (!fs.existsSync(utilsDest)) {
    fs.mkdirSync(utilsDest, { recursive: true });
  }
  
  const files = fs.readdirSync(utilsSrc);
  files.forEach(file => {
    const srcPath = path.join(utilsSrc, file);
    const destPath = path.join(utilsDest, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${srcPath} to ${destPath}`);
    }
  });
}

console.log('✅ Build completed successfully!'); 
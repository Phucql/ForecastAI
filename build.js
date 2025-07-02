#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Building server for production...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Compile TypeScript server
  console.log('📦 Compiling TypeScript server...');
  execSync('npx tsc --project tsconfig.server.json', { stdio: 'inherit' });

  // Copy package.json to dist for production dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const productionPackage = {
    name: packageJson.name,
    version: packageJson.version,
    type: 'module',
    scripts: {
      start: 'node server.js'
    },
    dependencies: packageJson.dependencies
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(productionPackage, null, 2));

  console.log('✅ Server build completed successfully!');
  console.log('📁 Compiled files are in the dist/ directory');
  console.log('🚀 To run: cd dist && npm install && npm start');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 
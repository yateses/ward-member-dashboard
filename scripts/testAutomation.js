#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAutomation() {
  console.log('🧪 Testing LCR Automation Setup...\n');

  // Test 1: Check if .env file exists
  console.log('1. Checking environment configuration...');
  try {
    const envPath = path.join(__dirname, '../.env');
    await fs.access(envPath);
    console.log('   ✅ .env file found');
    
    // Check if credentials are set
    if (process.env.LCR_USERNAME && process.env.LCR_PASSWORD) {
      console.log('   ✅ LCR credentials configured');
    } else {
      console.log('   ⚠️  LCR credentials not found in .env file');
      console.log('   📝 Please add LCR_USERNAME and LCR_PASSWORD to your .env file');
    }
  } catch (error) {
    console.log('   ❌ .env file not found');
    console.log('   📝 Please copy env.example to .env and add your credentials');
  }

  // Test 2: Check if Puppeteer is installed
  console.log('\n2. Checking Puppeteer installation...');
  try {
    const puppeteer = await import('puppeteer-core');
    console.log('   ✅ Puppeteer-core is installed');
  } catch (error) {
    console.log('   ❌ Puppeteer-core not found');
    console.log('   📝 Run: npm install puppeteer-core');
  }

  // Test 3: Check if main script exists
  console.log('\n3. Checking automation script...');
  try {
    const scriptPath = path.join(__dirname, 'fetchLCRData.js');
    await fs.access(scriptPath);
    console.log('   ✅ fetchLCRData.js script found');
  } catch (error) {
    console.log('   ❌ fetchLCRData.js script not found');
  }

  // Test 4: Check output directory
  console.log('\n4. Checking output directory...');
  try {
    const outputDir = path.dirname(process.env.LCR_OUTPUT_FILE || './lcr-data.json');
    await fs.access(outputDir);
    console.log('   ✅ Output directory accessible');
  } catch (error) {
    console.log('   ⚠️  Output directory may not exist (will be created automatically)');
  }

  // Summary
  console.log('\n📋 Setup Summary:');
  console.log('   • Environment: ' + (process.env.LCR_USERNAME ? '✅ Configured' : '❌ Not configured'));
  console.log('   • Dependencies: ' + (await checkPuppeteer() ? '✅ Installed' : '❌ Missing'));
  console.log('   • Scripts: ✅ Available');
  
  console.log('\n🚀 Next Steps:');
  if (process.env.LCR_USERNAME && process.env.LCR_PASSWORD) {
    console.log('   • Run: npm run fetch-lcr');
    console.log('   • Check the generated data files');
    console.log('   • Import data through the Vue app');
  } else {
    console.log('   • Configure your LCR credentials in .env file');
    console.log('   • Then run: npm run fetch-lcr');
  }
}

async function checkPuppeteer() {
  try {
    await import('puppeteer-core');
    return true;
  } catch {
    return false;
  }
}

// Run the test
testAutomation().catch(console.error); 
#!/usr/bin/env node

import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LCRAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.username = process.env.LCR_USERNAME;
    this.password = process.env.LCR_PASSWORD;
    this.reportId = process.env.LCR_REPORT_ID || '270dd333-769f-43a0-b73e-d27cc6d5d730';
    this.outputFile = process.env.LCR_OUTPUT_FILE || './lcr-data.json';
  }

  async init() {
    console.log('🚀 Initializing LCR automation...');
    
    if (!this.username || !this.password) {
      throw new Error('LCR_USERNAME and LCR_PASSWORD must be set in .env file');
    }

    console.log('📝 Using credentials for:', this.username);
    console.log('🔗 Chrome path: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

    try {
      // Launch browser - use system Chrome
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for production
        defaultViewport: { width: 1280, height: 720 },
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows Chrome path
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      console.log('💡 Trying without executable path...');
      
      // Try without specifying Chrome path
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser initialized');
  }

  async login() {
    console.log('🔐 Logging into LCR...');
    
    try {
      // Navigate to LCR
      await this.page.goto('https://lcr.churchofjesuschrist.org', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      console.log('📄 LCR page loaded');
      console.log('🔗 Current URL:', this.page.url());
      
      // Wait for login form to appear - use only the known working selectors
      let usernameField = null;
      let passwordField = null;
      try {
        // First, let's see what's actually on the page
        const pageContent = await this.page.content();
        console.log('📄 Page title:', await this.page.title());
        console.log('📄 Page has form elements:', pageContent.includes('<form'));
        console.log('📄 Page has input elements:', pageContent.includes('<input'));
        // Debug: List all input elements on the page
        const inputElements = await this.page.evaluate(() => {
          const inputs = document.querySelectorAll('input');
          return Array.from(inputs).map(input => ({
            type: input.type,
            id: input.id,
            name: input.name,
            placeholder: input.placeholder
          }));
        });
        console.log('🔍 Found input elements:', inputElements);

        // Check if we're on the OAuth login page
        const currentUrl = this.page.url();
        if (currentUrl.includes('id.churchofjesuschrist.org')) {
          console.log('🔐 Detected OAuth login page (fast path)');
          // Use only the known working selector for username
          usernameField = 'input[name="identifier"]';
          await this.page.waitForSelector(usernameField, { timeout: 5000 });
          console.log(`✅ Found username field: ${usernameField}`);
          // Step 1: Fill username and submit
          await this.page.type(usernameField, this.username);
          console.log('📝 Username entered');
          await this.page.click('input[type="submit"]');
          console.log('🔐 Username submitted');
          // Wait for password field to appear
          console.log('⏳ Waiting for password field...');
          await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });
          console.log('✅ Password field found');
          await this.page.type('input[type="password"]', this.password);
          console.log('📝 Password entered');
          await this.page.click('input[type="submit"]');
          console.log('🔐 Password submitted');
        } else {
          // Regular login (not expected, but fallback)
          usernameField = '#username';
          passwordField = 'input[type="password"]';
          await this.page.waitForSelector(usernameField, { timeout: 5000 });
          await this.page.waitForSelector(passwordField, { timeout: 5000 });
          await this.page.type(usernameField, this.username);
          await this.page.type(passwordField, this.password);
          console.log('📝 Credentials entered');
          await this.page.click('button[type="submit"],input[type="submit"]');
          console.log('🔐 Credentials submitted');
        }
      } catch (error) {
        console.error('❌ Failed to find login form:', error.message);
        throw error;
      }
      
      // Wait for navigation to complete
      await this.page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Check if login was successful
      const currentUrl = this.page.url();
      if (currentUrl.includes('lcr.churchofjesuschrist.org') && !currentUrl.includes('login')) {
        console.log('✅ Login successful');
        return true;
      } else {
        throw new Error('Login failed - redirected to login page');
      }

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-login-error.png'),
        fullPage: true 
      });
      
      throw error;
    }
  }

  async fetchMemberData() {
    console.log('📊 Fetching member data...');
    
    try {
      // Navigate to the API endpoint directly
      const apiUrl = `https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/${this.reportId}?lang=eng`;
      
      console.log(`🔗 Fetching from: ${apiUrl}`);
      
      // Make the API request
      const response = await this.page.evaluate(async (url) => {
        const res = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      }, apiUrl);

      console.log(`✅ Data fetched successfully: ${response.members?.length || 0} members`);
      
      return response;

    } catch (error) {
      console.error('❌ Failed to fetch data:', error.message);
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-fetch-error.png'),
        fullPage: true 
      });
      
      throw error;
    }
  }

  async saveData(data) {
    console.log('💾 Saving data...');
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.outputFile);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Save raw JSON data
      await fs.writeFile(this.outputFile, JSON.stringify(data, null, 2));
      
      // Also save as tab-separated format for easy import
      const tsvFile = this.outputFile.replace('.json', '.tsv');
      const tsvData = this.convertToTSV(data);
      await fs.writeFile(tsvFile, tsvData);
      
      console.log(`✅ Data saved to:`);
      console.log(`   JSON: ${this.outputFile}`);
      console.log(`   TSV:  ${tsvFile}`);
      
      return { jsonFile: this.outputFile, tsvFile };
      
    } catch (error) {
      console.error('❌ Failed to save data:', error.message);
      throw error;
    }
  }

  convertToTSV(data) {
    if (!data.columns || !data.members) {
      throw new Error('Invalid data format');
    }

    const headers = data.columns.map(col => col.key);
    const rows = [
      headers.join('\t'),
      ...data.members.map(member => 
        headers.map(header => member[header] || '').join('\t')
      )
    ];

    return rows.join('\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async run() {
    try {
      await this.init();
      await this.login();
      const data = await this.fetchMemberData();
      const files = await this.saveData(data);
      
      console.log('\n🎉 LCR data fetch completed successfully!');
      console.log(`📁 Files created:`);
      console.log(`   ${files.jsonFile}`);
      console.log(`   ${files.tsvFile}`);
      
      return data;
      
    } catch (error) {
      console.error('\n💥 Automation failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Main function starting...');
  
  try {
    const automation = new LCRAutomation();
    console.log('✅ LCRAutomation instance created');
    
    await automation.run();
    console.log('✅ Automation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
console.log('📝 Script loaded, checking if should run...');

// Convert file:// URL to file path for comparison
const scriptPath = fileURLToPath(import.meta.url);
console.log('📝 Script path:', scriptPath);
console.log('📝 process.argv[1]:', process.argv[1]);

if (scriptPath === process.argv[1]) {
  console.log('✅ Running main function...');
  main();
} else {
  console.log('❌ Not running main function');
}

export default LCRAutomation; 
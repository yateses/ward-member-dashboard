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

    const hasCredentials = !!(this.username && this.password);
    if (!hasCredentials) {
      console.log('⚠️ No LCR_USERNAME/LCR_PASSWORD in .env - you will be prompted to sign in manually in the browser.');
    } else {
      console.log('📝 Using credentials for:', this.username);
    }
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

  /**
   * Wait for the user to complete login manually. Polls until URL is LCR main page or timeout.
   * @param {number} timeoutMs - Max time to wait (default 5 minutes)
   * @returns {Promise<boolean>}
   */
  async waitForManualLogin(timeoutMs = 5 * 60 * 1000) {
    const stepMs = 2000;
    const start = Date.now();
    console.log('\n👤 MANUAL LOGIN: Please sign in using the browser window that opened.');
    console.log('   The script will continue automatically once you reach the LCR main page.');
    console.log(`   Waiting up to ${Math.round(timeoutMs / 60000)} minutes...\n`);

    while (Date.now() - start < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, stepMs));
      const currentUrl = this.page.url();
      if (currentUrl.includes('lcr.churchofjesuschrist.org') && !currentUrl.includes('id.churchofjesuschrist.org')) {
        console.log('✅ Manual login detected - reached LCR.');
        return true;
      }
      if (currentUrl.includes('error') || currentUrl.includes('denied')) {
        throw new Error('Login failed - access denied or error page');
      }
    }
    throw new Error('Manual login timeout - did not reach LCR in time.');
  }

  async login() {
    console.log('🔐 Logging into LCR...');
    const hasCredentials = !!(this.username && this.password);

    try {
      // Navigate to LCR with longer timeout
      await this.page.goto('https://lcr.churchofjesuschrist.org', {
        waitUntil: 'networkidle2',
        timeout: 60000  // Increased to 60 seconds
      });

      console.log('📄 LCR page loaded');
      console.log('🔗 Current URL:', this.page.url());

      // If no credentials, go straight to manual login wait
      if (!hasCredentials) {
        const currentUrl = this.page.url();
        if (currentUrl.includes('lcr.churchofjesuschrist.org') && !currentUrl.includes('id.churchofjesuschrist.org')) {
          console.log('✅ Already on LCR (no login required).');
          return true;
        }
        return await this.waitForManualLogin();
      }

      // Wait for login form to appear - updated for new layout
      try {
        // Check if we're on the OAuth login page
        const currentUrl = this.page.url();
        if (currentUrl.includes('id.churchofjesuschrist.org')) {
          console.log('🔐 Detected OAuth login page (new layout)');
          
          // Wait for username field with new selector
          const usernameField = '#username-input';
          await this.page.waitForSelector(usernameField, { timeout: 15000 });
          console.log(`✅ Found username field: ${usernameField}`);
          
          // Step 1: Fill username
          await this.page.type(usernameField, this.username);
          console.log('📝 Username entered');
          
          // Click the "Next" button
          const nextButton = '#button-primary';
          await this.page.waitForSelector(nextButton, { timeout: 15000 });
          await this.page.click(nextButton);
          console.log('🔐 Username submitted via Next button');
          
          // Wait for password field to appear
          console.log('⏳ Waiting for password field...');
          await this.page.waitForSelector('input[type="password"]', { timeout: 15000 });
          console.log('✅ Password field found');
          
          // Fill password
          await this.page.type('input[type="password"]', this.password);
          console.log('📝 Password entered');
          
          // Take a screenshot to see the password page
          await this.page.screenshot({ 
            path: path.join(__dirname, '../debug-password-page.png'),
            fullPage: true 
          });
          console.log('📸 Screenshot saved: debug-password-page.png');
          
          // Wait a moment for the page to settle
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try multiple approaches to submit the password form
          console.log('🔐 Attempting to submit password...');
          
          // Method 1: Try the primary submit button
          try {
            const submitButton = await this.page.$('input[type="submit"], button[type="submit"], #button-primary');
            if (submitButton) {
              await submitButton.click();
              console.log('✅ Password submitted via submit button');
            } else {
              throw new Error('No submit button found');
            }
          } catch (error) {
            console.log('⚠️ Method 1 failed, trying Method 2...');
            
            // Method 2: Try pressing Enter key
            try {
              await this.page.keyboard.press('Enter');
              console.log('✅ Password submitted via Enter key');
            } catch (error2) {
              console.log('⚠️ Method 2 failed, trying Method 3...');
              
              // Method 3: Try clicking by text content
              try {
                await this.page.evaluate(() => {
                  const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
                  const submitBtn = buttons.find(btn => 
                    btn.textContent?.toLowerCase().includes('sign in') ||
                    btn.textContent?.toLowerCase().includes('submit') ||
                    btn.textContent?.toLowerCase().includes('verify') ||
                    btn.textContent?.toLowerCase().includes('continue')
                  );
                  if (submitBtn) {
                    submitBtn.click();
                    return true;
                  }
                  return false;
                });
                console.log('✅ Password submitted via text search');
              } catch (error3) {
                console.log('⚠️ Method 3 failed, trying Method 4...');
                
                // Method 4: Try form submission
                try {
                  await this.page.evaluate(() => {
                    const forms = document.querySelectorAll('form');
                    if (forms.length > 0) {
                      forms[0].submit();
                      return true;
                    }
                    return false;
                  });
                  console.log('✅ Password submitted via form submission');
                } catch (error4) {
                  console.log('⚠️ Method 4 failed, trying Method 5...');
                  
                  // Method 5: Try clicking any button that looks like submit
                  try {
                    await this.page.evaluate(() => {
                      const buttons = Array.from(document.querySelectorAll('button'));
                      const submitBtn = buttons.find(btn => 
                        btn.type === 'submit' ||
                        btn.className?.includes('primary') ||
                        btn.className?.includes('submit') ||
                        btn.className?.includes('signin')
                      );
                      if (submitBtn) {
                        submitBtn.click();
                        return true;
                      }
                      return false;
                    });
                    console.log('✅ Password submitted via button class search');
                  } catch (error5) {
                    throw new Error('All password submission methods failed');
                  }
                }
              }
            }
          }
        } else {
          // Fallback for any other login page
          console.log('🔐 Using fallback login method');
          const usernameField = '#username-input, input[name="identifier"], #username';
          const passwordField = 'input[type="password"]';
          
          await this.page.waitForSelector(usernameField, { timeout: 15000 });
          await this.page.waitForSelector(passwordField, { timeout: 15000 });
          
          await this.page.type(usernameField, this.username);
          await this.page.type(passwordField, this.password);
          console.log('📝 Credentials entered');
          
          // Try multiple approaches to submit credentials
          console.log('🔐 Attempting to submit credentials...');
          
          // Method 1: Try the primary submit button
          try {
            const submitButton = await this.page.$('button[type="submit"], input[type="submit"], #button-primary');
            if (submitButton) {
              await submitButton.click();
              console.log('✅ Credentials submitted via submit button');
            } else {
              throw new Error('No submit button found');
            }
          } catch (error) {
            console.log('⚠️ Method 1 failed, trying Method 2...');
            
            // Method 2: Try pressing Enter key
            try {
              await this.page.keyboard.press('Enter');
              console.log('✅ Credentials submitted via Enter key');
            } catch (error2) {
              console.log('⚠️ Method 2 failed, trying Method 3...');
              
              // Method 3: Try clicking by text content
              try {
                await this.page.evaluate(() => {
                  const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
                  const submitBtn = buttons.find(btn => 
                    btn.textContent?.toLowerCase().includes('sign in') ||
                    btn.textContent?.toLowerCase().includes('submit') ||
                    btn.textContent?.toLowerCase().includes('verify') ||
                    btn.textContent?.toLowerCase().includes('continue')
                  );
                  if (submitBtn) {
                    submitBtn.click();
                    return true;
                  }
                  return false;
                });
                console.log('✅ Credentials submitted via text search');
              } catch (error3) {
                console.log('⚠️ Method 3 failed, trying Method 4...');
                
                // Method 4: Try form submission
                try {
                  await this.page.evaluate(() => {
                    const forms = document.querySelectorAll('form');
                    if (forms.length > 0) {
                      forms[0].submit();
                      return true;
                    }
                    return false;
                  });
                  console.log('✅ Credentials submitted via form submission');
                } catch (error4) {
                  throw new Error('All credential submission methods failed');
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Auto-login failed:', error.message);
        await this.page.screenshot({
          path: path.join(__dirname, '../debug-login-error.png'),
          fullPage: true
        });
        console.log('📸 Screenshot saved: debug-login-error.png');
        return await this.waitForManualLogin();
      }
      
      // Wait for navigation to complete with more flexible approach
      console.log('⏳ Waiting for login to complete...');
      
      // Wait up to 90 seconds for successful login
      let attempts = 0;
      const maxAttempts = 90; // 90 seconds
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
        
        const currentUrl = this.page.url();
        console.log(`🔍 Check ${attempts}: Current URL: ${currentUrl}`);
        
        // Check if we're successfully logged into LCR
        if (currentUrl.includes('lcr.churchofjesuschrist.org') && !currentUrl.includes('login') && !currentUrl.includes('id.churchofjesuschrist.org')) {
          console.log('✅ Login successful - reached LCR main page');
          return true;
        }
        
        // Check if we're still on login pages
        if (currentUrl.includes('id.churchofjesuschrist.org')) {
          console.log('⏳ Still on login page, waiting...');
          continue;
        }
        
        // Check if we got an error page
        if (currentUrl.includes('error') || currentUrl.includes('denied')) {
          throw new Error('Login failed - access denied or error page');
        }
      }
      
      // Auto-login timed out → prompt for manual login instead of failing
      console.log('⏳ Auto-login did not complete in time.');
      return await this.waitForManualLogin();

    } catch (error) {
      // Only fall back to manual login if we have a page and we're likely on a login screen
      const url = this.page?.url() || '';
      if (this.page && url.includes('id.churchofjesuschrist.org')) {
        console.error('❌ Auto-login failed:', error.message);
        console.log('📸 Screenshot saved: debug-login-error.png');
        await this.page.screenshot({
          path: path.join(__dirname, '../debug-login-error.png'),
          fullPage: true
        }).catch(() => {});
        return await this.waitForManualLogin();
      }
      console.error('❌ Login failed:', error.message);
      await this.page?.screenshot({
        path: path.join(__dirname, '../debug-login-error.png'),
        fullPage: true
      }).catch(() => {});
      throw error;
    }
  }

  async fetchMemberData() {
    console.log('📊 Fetching member data...');
    
    try {
      // First, let's make sure we're on the LCR main page
      console.log('🔍 Current URL before fetching:', this.page.url());
      
      // Wait a moment for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take a screenshot to see where we are
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-before-fetch.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved: debug-before-fetch.png');
      
      // Navigate to the API endpoint directly
      const apiUrl = `https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/${this.reportId}?lang=eng`;
      
      console.log(`🔗 Fetching from: ${apiUrl}`);
      
      // Make the API request with better error handling
      const response = await this.page.evaluate(async (url) => {
        try {
          console.log('🌐 Making fetch request to:', url);
          
          const res = await fetch(url, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Response status:', res.status);
          console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ API Error:', res.status, res.statusText);
            console.error('❌ Error body:', errorText);
            throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
          }
          
          const data = await res.json();
          console.log('✅ API response received:', data);
          return data;
          
        } catch (error) {
          console.error('❌ Fetch error:', error);
          throw error;
        }
      }, apiUrl);

      console.log(`✅ Data fetched successfully: ${response.members?.length || 0} members`);
      
      // Take a screenshot after successful fetch
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-after-fetch.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved: debug-after-fetch.png');
      
      return response;

    } catch (error) {
      console.error('❌ Failed to fetch data:', error.message);
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-fetch-error.png'),
        fullPage: true 
      });
      
      // Try alternative approach - navigate to the reports page first
      console.log('🔄 Trying alternative approach - navigating to reports page...');
      try {
        await this.page.goto('https://lcr.churchofjesuschrist.org/report/custom-reports', {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        console.log('📄 Reports page loaded');
        
        // Take screenshot of reports page
        await this.page.screenshot({ 
          path: path.join(__dirname, '../debug-reports-page.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot saved: debug-reports-page.png');
        
        // Try the API call again
        const apiUrl = `https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/${this.reportId}?lang=eng`;
        console.log(`🔗 Retrying API call: ${apiUrl}`);
        
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
        
        console.log(`✅ Alternative approach successful: ${response.members?.length || 0} members`);
        return response;
        
      } catch (altError) {
        console.error('❌ Alternative approach also failed:', altError.message);
        throw error; // Throw the original error
      }
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
      
      // Wait a moment before closing so user can see the success
      console.log('⏳ Waiting 5 seconds before closing browser...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return data;
      
    } catch (error) {
      console.error('\n💥 Automation failed:', error.message);
      
      // Wait a moment before closing so user can see the error
      console.log('⏳ Waiting 10 seconds before closing browser...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
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
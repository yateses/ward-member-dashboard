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

class LCRAPITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.username = process.env.LCR_USERNAME;
    this.password = process.env.LCR_PASSWORD;
    this.reportId = process.env.LCR_REPORT_ID || '33D30D27-9F76-A043-B73E-D27CC6D5D730';
  }

  async init() {
    console.log('🚀 Initializing LCR API tester...');
    
    if (!this.username || !this.password) {
      throw new Error('LCR_USERNAME and LCR_PASSWORD must be set in .env file');
    }
    
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser initialized');
  }

  async login() {
    console.log('🔐 Logging into LCR...');
    
    try {
      await this.page.goto('https://lcr.churchofjesuschrist.org', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      console.log('📄 LCR page loaded');
      console.log('🔗 Current URL:', this.page.url());
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('id.churchofjesuschrist.org')) {
        console.log('🔐 Detected OAuth login page');
        
        const usernameField = '#username-input';
        await this.page.waitForSelector(usernameField, { timeout: 15000 });
        await this.page.type(usernameField, this.username);
        console.log('📝 Username entered');
        
        const nextButton = '#button-primary';
        await this.page.waitForSelector(nextButton, { timeout: 15000 });
        await this.page.click(nextButton);
        console.log('🔐 Username submitted');
        
        await this.page.waitForSelector('input[type="password"]', { timeout: 15000 });
        await this.page.type('input[type="password"]', this.password);
        console.log('📝 Password entered');
        
        // Submit the password form with multiple fallback methods
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
                throw new Error('All password submission methods failed');
              }
            }
          }
        }
        
        // Wait for login to complete
        let attempts = 0;
        const maxAttempts = 90;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          
          const currentUrl = this.page.url();
          console.log(`🔍 Check ${attempts}: Current URL: ${currentUrl}`);
          
          if (currentUrl.includes('lcr.churchofjesuschrist.org') && !currentUrl.includes('login') && !currentUrl.includes('id.churchofjesuschrist.org')) {
            console.log('✅ Login successful');
            return true;
          }
          
          if (currentUrl.includes('id.churchofjesuschrist.org')) {
            console.log('⏳ Still on login page, waiting...');
            continue;
          }
          
          if (currentUrl.includes('error') || currentUrl.includes('denied')) {
            throw new Error('Login failed - access denied or error page');
          }
        }
        
        throw new Error('Login timeout');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  async testAPIEndpoints() {
    console.log('🔍 Testing LCR API endpoints...');
    
    try {
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot of current page
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-api-test-current.png'),
        fullPage: true 
      });
      
      // Test the main API endpoint
      const apiUrl = `https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/${this.reportId}?lang=eng`;
      console.log(`🔗 Testing API endpoint: ${apiUrl}`);
      
      const result = await this.page.evaluate(async (url) => {
        try {
          console.log('🌐 Making API request to:', url);
          
          const response = await fetch(url, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Response status:', response.status);
          console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const errorText = await response.text();
            return {
              success: false,
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              headers: Object.fromEntries(response.headers.entries())
            };
          }
          
          const data = await response.json();
          return {
            success: true,
            data: data,
            memberCount: data.members?.length || 0
          };
          
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }, apiUrl);
      
      console.log('📊 API Test Result:', result);
      
      if (result.success) {
        console.log(`✅ API test successful: ${result.memberCount} members found`);
      } else {
        console.log(`❌ API test failed: ${result.status} ${result.statusText}`);
        console.log(`❌ Error: ${result.error}`);
      }
      
      // Test alternative endpoints
      const alternativeEndpoints = [
        'https://lcr.churchofjesuschrist.org/api/report/custom-reports',
        'https://lcr.churchofjesuschrist.org/api/report/custom-reports/list',
        'https://lcr.churchofjesuschrist.org/api/report/custom-reports/available'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        console.log(`🔗 Testing alternative endpoint: ${endpoint}`);
        
        try {
          const altResult = await this.page.evaluate(async (url) => {
            const response = await fetch(url, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json'
              }
            });
            
            return {
              status: response.status,
              ok: response.ok,
              data: response.ok ? await response.json() : null
            };
          }, endpoint);
          
          console.log(`📊 ${endpoint}: ${altResult.status} ${altResult.ok ? '✅' : '❌'}`);
          if (altResult.data) {
            console.log(`📊 Data:`, altResult.data);
          }
        } catch (error) {
          console.log(`❌ ${endpoint}: Error - ${error.message}`);
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      throw error;
    }
  }

  async cleanup() {
    if (this.browser) {
      console.log('⏳ Waiting 10 seconds before closing browser...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async run() {
    try {
      await this.init();
      await this.login();
      await this.testAPIEndpoints();
      console.log('\n🎉 API testing completed!');
    } catch (error) {
      console.error('\n💥 API testing failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 LCR API Tester starting...');
  
  try {
    const tester = new LCRAPITester();
    await tester.run();
    console.log('✅ API testing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export default LCRAPITester;

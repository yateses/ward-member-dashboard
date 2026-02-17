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

class LCRLoginTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.username = process.env.LCR_USERNAME;
    this.password = process.env.LCR_PASSWORD;
  }

  async init() {
    console.log('🚀 Initializing LCR login tester...');
    
    if (!this.username || !this.password) {
      throw new Error('LCR_USERNAME and LCR_PASSWORD must be set in .env file');
    }
    
    try {
      // Launch browser - use system Chrome
      this.browser = await puppeteer.launch({
        headless: false, // Keep visible for debugging
        defaultViewport: { width: 1280, height: 720 },
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      console.log('💡 Trying without executable path...');
      
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser initialized');
  }

  async testLogin() {
    console.log('🔐 Testing LCR login with new selectors...');
    
    try {
      // Navigate to LCR
      await this.page.goto('https://lcr.churchofjesuschrist.org', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      console.log('📄 LCR page loaded');
      console.log('🔗 Current URL:', this.page.url());
      
      // Check if we're on the OAuth login page
      const currentUrl = this.page.url();
      if (currentUrl.includes('id.churchofjesuschrist.org')) {
        console.log('🔐 Detected OAuth login page (new layout)');
        
        // Step 1: Find and fill username field
        const usernameField = '#username-input';
        await this.page.waitForSelector(usernameField, { timeout: 15000 });
        console.log(`✅ Found username field: ${usernameField}`);
        
        await this.page.type(usernameField, this.username);
        console.log('📝 Username entered');
        
        // Take screenshot after username entry
        await this.page.screenshot({ 
          path: path.join(__dirname, '../debug-username-entered.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot saved: debug-username-entered.png');
        
        // Step 2: Click the "Next" button
        const nextButton = '#button-primary';
        await this.page.waitForSelector(nextButton, { timeout: 15000 });
        console.log(`✅ Found Next button: ${nextButton}`);
        
        await this.page.click(nextButton);
        console.log('🔐 Username submitted via Next button');
        
        // Wait a moment for the page to transition
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take screenshot after clicking Next
        await this.page.screenshot({ 
          path: path.join(__dirname, '../debug-after-next.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot saved: debug-after-next.png');
        
        // Step 3: Wait for password field to appear
        console.log('⏳ Waiting for password field...');
        await this.page.waitForSelector('input[type="password"]', { timeout: 15000 });
        console.log('✅ Password field found');
        
        // Take screenshot of password page
        await this.page.screenshot({ 
          path: path.join(__dirname, '../debug-password-page.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot saved: debug-password-page.png');
        
        // Step 4: Fill password
        await this.page.type('input[type="password"]', this.password);
        console.log('📝 Password entered');
        
        // Take screenshot after password entry
        await this.page.screenshot({ 
          path: path.join(__dirname, '../debug-password-entered.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot saved: debug-password-entered.png');
        
        // Step 5: Submit the password form
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
        
        // Wait for navigation to complete
        console.log('⏳ Waiting for login to complete...');
        
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
            
            // Take final screenshot
            await this.page.screenshot({ 
              path: path.join(__dirname, '../debug-login-success.png'),
              fullPage: true 
            });
            console.log('📸 Screenshot saved: debug-login-success.png');
            
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
        
        // If we get here, we timed out
        throw new Error('Login timeout - page did not redirect to LCR within 90 seconds');
        
      } else {
        console.log('🔐 Using fallback login method');
        // Fallback logic for any other login page
        const usernameField = '#username-input, input[name="identifier"], #username';
        const passwordField = 'input[type="password"]';
        
        await this.page.waitForSelector(usernameField, { timeout: 15000 });
        await this.page.waitForSelector(passwordField, { timeout: 15000 });
        
        await this.page.type(usernameField, this.username);
        await this.page.type(passwordField, this.password);
        console.log('📝 Credentials entered');
        
        await this.page.click('button[type="submit"], input[type="submit"], #button-primary');
        console.log('🔐 Credentials submitted');
        
        return true;
      }

    } catch (error) {
      console.error('❌ Login test failed:', error.message);
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: path.join(__dirname, '../debug-login-test-error.png'),
        fullPage: true 
      });
      
      throw error;
    }
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
      await this.testLogin();
      console.log('\n🎉 Login test completed successfully!');
    } catch (error) {
      console.error('\n💥 Login test failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 LCR Login Test starting...');
  
  try {
    const tester = new LCRLoginTester();
    await tester.run();
    console.log('✅ Login test completed successfully');
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

export default LCRLoginTester;

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
  }

  async init() {
    console.log('🚀 Initializing LCR login tester...');
    
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

  async analyzeLoginPage() {
    console.log('🔍 Analyzing LCR login page...');
    
    try {
      // Navigate to LCR
      await this.page.goto('https://lcr.churchofjesuschrist.org', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      console.log('📄 LCR page loaded');
      console.log('🔗 Current URL:', this.page.url());
      console.log('📄 Page title:', await this.page.title());
      
      // Take a screenshot
      await this.page.screenshot({ 
        path: path.join(__dirname, '../lcr-login-current.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved as lcr-login-current.png');

      // Analyze the page structure
      const pageAnalysis = await this.page.evaluate(() => {
        const analysis = {
          url: window.location.href,
          title: document.title,
          forms: [],
          inputs: [],
          buttons: [],
          links: [],
          pageContent: document.body.innerText.substring(0, 500) // First 500 chars
        };

        // Analyze forms
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
          analysis.forms.push({
            index,
            action: form.action,
            method: form.method,
            id: form.id,
            className: form.className
          });
        });

        // Analyze inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, index) => {
          analysis.inputs.push({
            index,
            type: input.type,
            id: input.id,
            name: input.name,
            placeholder: input.placeholder,
            className: input.className,
            value: input.value,
            required: input.required,
            autocomplete: input.autocomplete
          });
        });

        // Analyze buttons
        const buttons = document.querySelectorAll('button, input[type="submit"]');
        buttons.forEach((button, index) => {
          analysis.buttons.push({
            index,
            type: button.type,
            id: button.id,
            name: button.name,
            className: button.className,
            textContent: button.textContent?.trim(),
            value: button.value
          });
        });

        // Analyze links
        const links = document.querySelectorAll('a');
        links.forEach((link, index) => {
          analysis.links.push({
            index,
            href: link.href,
            textContent: link.textContent?.trim(),
            className: link.className
          });
        });

        return analysis;
      });

      console.log('\n📊 Page Analysis:');
      console.log('URL:', pageAnalysis.url);
      console.log('Title:', pageAnalysis.title);
      console.log('Forms found:', pageAnalysis.forms.length);
      console.log('Inputs found:', pageAnalysis.inputs.length);
      console.log('Buttons found:', pageAnalysis.buttons.length);
      console.log('Links found:', pageAnalysis.links.length);
      
      console.log('\n📝 Forms:');
      pageAnalysis.forms.forEach(form => {
        console.log(`  Form ${form.index}: action="${form.action}" method="${form.method}" id="${form.id}" class="${form.className}"`);
      });

      console.log('\n📝 Inputs:');
      pageAnalysis.inputs.forEach(input => {
        console.log(`  Input ${input.index}: type="${input.type}" id="${input.id}" name="${input.name}" placeholder="${input.placeholder}" class="${input.className}"`);
      });

      console.log('\n📝 Buttons:');
      pageAnalysis.buttons.forEach(button => {
        console.log(`  Button ${button.index}: type="${button.type}" id="${button.id}" text="${button.textContent}" class="${button.className}"`);
      });

      console.log('\n📝 Page Content Preview:');
      console.log(pageAnalysis.pageContent);

      // Save analysis to file
      await fs.writeFile(
        path.join(__dirname, '../lcr-login-analysis.json'),
        JSON.stringify(pageAnalysis, null, 2)
      );
      console.log('💾 Analysis saved to lcr-login-analysis.json');

      return pageAnalysis;

    } catch (error) {
      console.error('❌ Failed to analyze login page:', error.message);
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
      await this.analyzeLoginPage();
      console.log('\n🎉 Login page analysis completed!');
    } catch (error) {
      console.error('\n💥 Analysis failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 LCR Login Tester starting...');
  
  try {
    const tester = new LCRLoginTester();
    await tester.run();
    console.log('✅ Analysis completed successfully');
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


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

/** Map LCR column display names to MemberImportData keys (required for app import). */
const LCR_LABEL_TO_IMPORT_KEY = {
  'preferred name': 'PREFERRED_NAME',
  'preferredname': 'PREFERRED_NAME',
  'name': 'PREFERRED_NAME',
  'member name': 'PREFERRED_NAME',
  'head of house': 'HEAD_OF_HOUSE',
  'headofhouse': 'HEAD_OF_HOUSE',
  'head of household': 'HEAD_OF_HOUSE',
  'address street 1': 'ADDRESS_STREET_1',
  'address - street 1': 'ADDRESS_STREET_1',
  'address': 'ADDRESS_STREET_1',
  'street address': 'ADDRESS_STREET_1',
  'age': 'AGE',
  'gender': 'GENDER',
  'birth date': 'BIRTH_DATE',
  'birth date (1 jan 1990)': 'BIRTH_DATE',
  'birthdate': 'BIRTH_DATE',
  'birth day': 'BIRTH_DAY',
  'birth day (1)': 'BIRTH_DAY',
  'birthday': 'BIRTH_DAY',
  'birth month': 'BIRTH_MONTH',
  'birth month (jan)': 'BIRTH_MONTH',
  'birthmonth': 'BIRTH_MONTH',
  'birth year': 'BIRTH_YEAR',
  'birthyear': 'BIRTH_YEAR',
  'baptism date': 'BAPTISM_DATE',
  'baptismdate': 'BAPTISM_DATE',
  'callings': 'CALLINGS',
  'birthplace': 'BIRTHPLACE',
  'birth place': 'BIRTHPLACE',
  'individual phone': 'INDIVIDUAL_PHONE',
  'phone': 'INDIVIDUAL_PHONE',
  'individual email': 'INDIVIDUAL_EMAIL',
  'individual e-mail': 'INDIVIDUAL_EMAIL',
  'email': 'INDIVIDUAL_EMAIL',
  'marriage date': 'MARRIAGE_DATE',
  'marriagedate': 'MARRIAGE_DATE',
  'priesthood office': 'PRIESTHOOD_OFFICE',
  'priesthood': 'PRIESTHOOD_OFFICE',
  'temple recommend expiration date': 'TEMPLE_RECOMMEND_EXPIRATION_DATE',
  'temple recommend': 'TEMPLE_RECOMMEND_EXPIRATION_DATE',
  'recommend expiration': 'TEMPLE_RECOMMEND_EXPIRATION_DATE'
};

/** Normalize doubled LCR header text (e.g. "Preferred NamePreferred Name" -> "Preferred Name"). */
function undoubleHeaderText(text) {
  if (!text || typeof text !== 'string') return text;
  const t = text.trim();
  const half = Math.floor(t.length / 2);
  if (half > 0 && t.slice(0, half) === t.slice(half)) return t.slice(0, half).trim();
  return t;
}

function normalizeTableDataForImport(columns, members) {
  if (!Array.isArray(members) || members.length === 0) return { columns, members };
  const normalizedCols = [];
  const keyMap = {}; // old key -> canonical key
  columns.forEach((col, i) => {
    const rawKey = (col && (col.key || col.label)) || `col${i}`;
    const single = undoubleHeaderText(rawKey);
    const label = (single || rawKey).trim().toLowerCase();
    const canonical = LCR_LABEL_TO_IMPORT_KEY[label] || single.replace(/\s+/g, '_').replace(/[()]/g, '').toUpperCase() || rawKey.replace(/\s+/g, '_').toUpperCase();
    keyMap[rawKey] = canonical;
    normalizedCols.push({ key: canonical, label: undoubleHeaderText(col?.label || rawKey) });
  });
  /** Strip LCR column header from start of cell value (headers are often concatenated with data in the DOM). */
  function stripHeaderFromValue(value, headerKey) {
    if (value == null || typeof value !== 'string') return value == null ? '' : String(value).trim();
    let v = value.trim();
    if (!headerKey) return v;
    const single = undoubleHeaderText(headerKey);
    // Strip undoubled header first (e.g. "Preferred Name" from "Preferred NameAsiata, Nicholas")
    if (single && v.startsWith(single)) v = v.slice(single.length).trim();
    // Also strip full raw header if present (e.g. doubled "Preferred NamePreferred Name")
    if (headerKey.length > 0 && v.startsWith(headerKey)) v = v.slice(headerKey.length).trim();
    return v;
  }

  /** Clean LCR cell values: strip header prefix, then normalize AGE/GENDER. */
  function cleanCellValue(key, value, headerKey) {
    let v = stripHeaderFromValue(value, headerKey);
    if (key === 'AGE') return v.replace(/^Age\s*/i, '').trim();
    if (key === 'GENDER') {
      const after = v.replace(/^Gender\s*/i, '').trim();
      const c = (after[0] || '').toUpperCase();
      return c === 'M' || c === 'F' ? c : after;
    }
    return v;
  }

  const normalizedMembers = members.filter(m => {
    const keys = Object.keys(m);
    const isHeaderRow = keys.every(k => (m[k] || '').toString().trim() === (k || '').trim());
    return !isHeaderRow;
  }).map(m => {
    const row = {};
    Object.keys(m).forEach(oldKey => {
      const newKey = keyMap[oldKey] || undoubleHeaderText(oldKey).replace(/\s+/g, '_').replace(/[()]/g, '').toUpperCase();
      const raw = m[oldKey] != null ? String(m[oldKey]).trim() : '';
      row[newKey] = cleanCellValue(newKey, raw, oldKey);
    });
    // If HEAD_OF_HOUSE is empty (e.g. row 362 in LCR), use PREFERRED_NAME so import validation passes
    if (!row.HEAD_OF_HOUSE || !row.HEAD_OF_HOUSE.trim()) {
      row.HEAD_OF_HOUSE = (row.PREFERRED_NAME && row.PREFERRED_NAME.trim()) ? row.PREFERRED_NAME : 'Unknown';
    }
    return row;
  });
  return { columns: normalizedCols, members: normalizedMembers };
}

/**
 * Extract { columns, members } from Next.js RSC (text/x-component) response.
 * Finds "members" and "columns" keys and parses their JSON arrays (balanced brackets).
 */
function extractMembersFromRSC(text) {
  if (!text || typeof text !== 'string') return null;
  function extractArray(key) {
    const keyStr = `"${key}"`;
    const idx = text.indexOf(keyStr);
    if (idx === -1) return null;
    const start = text.indexOf('[', idx);
    if (start === -1) return null;
    let depth = 1;
    let i = start + 1;
    let inString = false;
    let escape = false;
    let quote = '';
    while (i < text.length && depth > 0) {
      const c = text[i];
      if (escape) { escape = false; i++; continue; }
      if (inString) {
        if (c === '\\') escape = true;
        else if (c === quote) inString = false;
        i++;
        continue;
      }
      if (c === '"' || c === "'") { inString = true; quote = c; i++; continue; }
      if (c === '[') depth++;
      else if (c === ']') depth--;
      i++;
    }
    if (depth !== 0) return null;
    try {
      return JSON.parse(text.slice(start, i));
    } catch (_) {
      return null;
    }
  }
  const members = extractArray('members');
  if (!members || !Array.isArray(members)) return null;
  const columns = extractArray('columns');
  return {
    columns: Array.isArray(columns) ? columns : [],
    members
  };
}

class LCRAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.username = process.env.LCR_USERNAME;
    this.password = process.env.LCR_PASSWORD;
    this.reportId = process.env.LCR_REPORT_ID || '33D30D27-9F76-A043-B73E-D27CC6D5D730';
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

    // URL candidates in scope for both initial try and alternative approach
    const reportUrlCandidates = [
      `https://mltp-api.churchofjesuschrist.org/report/custom-reports/run-report/${this.reportId}?lang=eng`,
      `https://mltp-api.churchofjesuschrist.org/api/report/custom-reports/run-report/${this.reportId}?lang=eng`,
      `https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-details/${this.reportId}?lang=eng`,
      `https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/criteria/${this.reportId}?lang=eng`,
      `https://lcr.churchofjesuschrist.org/mlt/api/report/custom-reports/run-report/${this.reportId}?lang=eng`,
      `https://lcr.churchofjesuschrist.org/api/mlt/report/custom-reports/run-report/${this.reportId}?lang=eng`,
      `https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-run-report/${this.reportId}?lang=eng`,
      `https://lcr.churchofjesuschrist.org/api/report/custom-reports/run-report/${this.reportId}?lang=eng`
    ];
    
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

      let response = null;
      let lastError = null;

      // Try POST to custom-reports-details (Next.js RSC) - this is how the LCR UI loads report data
      const detailsPostUrl = `https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-details/${this.reportId}`;
      console.log(`🔗 Trying POST (RSC): ${detailsPostUrl}`);
      try {
        const postResult = await this.page.evaluate(async (url) => {
          const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'text/x-component',
              'Content-Type': 'text/plain;charset=UTF-8'
            },
            body: ''
          });
          if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
          const text = await res.text();
          return { ok: true, text };
        }, detailsPostUrl);
        if (postResult.ok && postResult.text) {
          const extracted = extractMembersFromRSC(postResult.text);
          if (extracted && Array.isArray(extracted.members)) {
            response = extracted;
            console.log(`✅ Data fetched from POST ${detailsPostUrl} (${extracted.members.length} members)`);
          } else {
            await fs.writeFile(
              path.join(__dirname, '../debug-rsc-response.txt'),
              postResult.text.slice(0, 200000),
              'utf8'
            ).catch(() => {});
            console.log('📄 Saved raw POST response to debug-rsc-response.txt');
          }
        }
      } catch (err) {
        console.log(`⚠️ POST failed: ${err.message}`);
      }

      if (!response) {
      for (const apiUrl of reportUrlCandidates) {
        console.log(`🔗 Trying: ${apiUrl}`);
        try {
          const data = await this.page.evaluate(async (url) => {
            const res = await fetch(url, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
            }
            const contentType = res.headers.get('Content-Type') || '';
            if (!contentType.includes('application/json')) {
              throw new Error('Response is not JSON');
            }
            return await res.json();
          }, apiUrl);
          const members = data?.members ?? data?.data?.members;
          if (data && Array.isArray(members)) {
            response = {
              columns: data.columns ?? data.data?.columns ?? [],
              members
            };
            console.log(`✅ Data fetched from: ${apiUrl}`);
            break;
          }
        } catch (err) {
          console.log(`⚠️ Failed: ${err.message}`);
          lastError = err;
        }
      }
      }

      if (!response) {
        throw lastError || new Error('All report URL candidates failed');
      }

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
      
      // Try alternative approach - navigate to report details page then POST (same as LCR UI)
      console.log('🔄 Trying alternative approach - navigating to report details page...');
      try {
        const detailsPageUrl = `https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-details/${this.reportId}`;
        await this.page.goto(detailsPageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('📄 Details page loaded:', this.page.url());
        await new Promise(r => setTimeout(r, 3000));
        try {
          await this.page.waitForSelector('table[role="grid"], table, [role="grid"]', { timeout: 15000 });
          await new Promise(r => setTimeout(r, 2000));
        } catch (_) {}

        const postResult = await this.page.evaluate(async (url) => {
          const res = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Accept': 'text/x-component', 'Content-Type': 'text/plain;charset=UTF-8' },
            body: ''
          });
          if (!res.ok) return { ok: false, status: res.status };
          return { ok: true, text: await res.text() };
        }, detailsPageUrl);
        if (postResult.ok && postResult.text) {
          const extracted = extractMembersFromRSC(postResult.text);
          if (extracted && Array.isArray(extracted.members)) {
            console.log(`✅ Alternative approach (POST from details page): ${extracted.members.length} members`);
            return extracted;
          }
          // Save raw POST response for debugging RSC format
          await fs.writeFile(
            path.join(__dirname, '../debug-rsc-response.txt'),
            postResult.text.slice(0, 500000),
            'utf8'
          ).catch(() => {});
          console.log('📄 Saved raw POST response to debug-rsc-response.txt (for parser tuning)');
        }

        // Report is on screen – try to read report data from the page (table or React state)
        console.log('🔍 Extracting report data from page DOM/state...');
        const fromPage = await this.page.evaluate(() => {
          const out = { columns: [], members: [] };
          // Try __NEXT_DATA__ or similar
          const nd = document.getElementById('__NEXT_DATA__');
          if (nd && nd.textContent) {
            try {
              const d = JSON.parse(nd.textContent);
              const props = d?.props?.pageProps || d?.props || {};
              const members = props.members ?? props.reportData?.members ?? props.data?.members;
              const columns = props.columns ?? props.reportData?.columns ?? props.data?.columns;
              if (Array.isArray(members) && members.length > 0) {
                out.members = members;
                if (Array.isArray(columns)) out.columns = columns;
                return out;
              }
            } catch (_) {}
          }
          // Try data in script tags (RSC payload often in __next_f)
          const scripts = document.querySelectorAll('script');
          for (const s of scripts) {
            const t = s.textContent || '';
            const idx = t.indexOf('"members"');
            if (idx === -1) continue;
            const start = t.indexOf('[', idx);
            if (start === -1) continue;
            let depth = 1, i = start + 1, inStr = false, q = '';
            while (i < t.length && depth > 0) {
              const c = t[i];
              if (inStr) {
                if (c === '\\') i++;
                else if (c === q) inStr = false;
                i++;
                continue;
              }
              if (c === '"' || c === "'") { inStr = true; q = c; i++; continue; }
              if (c === '[') depth++;
              else if (c === ']') depth--;
              i++;
            }
            if (depth !== 0) continue;
            try {
              const arr = JSON.parse(t.slice(start, i));
              if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
                out.members = arr;
                return out;
              }
            } catch (_) {}
          }
          // Fallback: table with headers
          const table = document.querySelector('table[role="grid"], table.report-table, table');
          if (table) {
            const headers = [];
            const thead = table.querySelector('thead tr, tr');
            if (thead) {
              thead.querySelectorAll('th, td').forEach(cell => headers.push((cell.textContent || '').trim()));
            }
            const rows = table.querySelectorAll('tbody tr, tr');
            const members = [];
            rows.forEach((row, ri) => {
              if (ri === 0 && !table.querySelector('thead')) return;
              const cells = row.querySelectorAll('td, th');
              const obj = {};
              cells.forEach((cell, ci) => {
                const key = headers[ci] || `col${ci}`;
                obj[key] = (cell.textContent || '').trim();
              });
              if (Object.keys(obj).length) members.push(obj);
            });
            if (members.length > 0) {
              out.columns = headers.length ? headers.map((h, i) => ({ key: h || `col${i}`, label: h || `Column ${i + 1}` })) : Object.keys(members[0]).map(k => ({ key: k, label: k }));
              out.members = members;
              return out;
            }
          }
          return out;
        });
        if (fromPage.members && fromPage.members.length > 0) {
          console.log(`✅ Extracted ${fromPage.members.length} members from page`);
          const normalized = normalizeTableDataForImport(fromPage.columns || [], fromPage.members);
          console.log('📋 Normalized column keys for app import (e.g. PREFERRED_NAME, HEAD_OF_HOUSE)');
          return normalized;
        }

        await this.page.screenshot({
          path: path.join(__dirname, '../debug-reports-page.png'),
          fullPage: true
        });
        console.log('📸 Screenshot saved: debug-reports-page.png');

        for (const apiUrl of reportUrlCandidates) {
          console.log(`🔗 Retrying API: ${apiUrl}`);
          try {
            const data = await this.page.evaluate(async (url) => {
              const res = await fetch(url, {
                credentials: 'include',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              if (!(res.headers.get('Content-Type') || '').includes('application/json')) throw new Error('Not JSON');
              return await res.json();
            }, apiUrl);
            const members = data?.members ?? data?.data?.members;
            if (data && Array.isArray(members)) {
              const normalized = {
                columns: data.columns ?? data.data?.columns ?? [],
                members
              };
              console.log(`✅ Alternative approach successful: ${members.length} members`);
              return normalized;
            }
          } catch (_) { /* try next URL */ }
        }
        throw new Error('All retry URLs failed');
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
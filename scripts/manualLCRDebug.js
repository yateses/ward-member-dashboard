#!/usr/bin/env node
/**
 * Manual LCR debug script: login, list available reports, then try run-report.
 * Run with: node scripts/manualLCRDebug.js
 * Requires: .env with LCR_USERNAME, LCR_PASSWORD (or sign in manually when prompted)
 * Optional: LCR_REPORT_ID in .env to test a specific report
 */

import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPORT_ID = process.env.LCR_REPORT_ID || '33D30D27-9F76-A043-B73E-D27CC6D5D730';

async function launchBrowser() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (e) {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  return { browser, page };
}

async function waitForLCR(page, timeoutMs = 5 * 60 * 1000) {
  const stepMs = 2000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = page.url();
    if (url.includes('lcr.churchofjesuschrist.org') && !url.includes('id.churchofjesuschrist.org')) {
      return true;
    }
    await new Promise(r => setTimeout(r, stepMs));
  }
  throw new Error('Timeout waiting for LCR');
}

async function login(page) {
  console.log('🔐 Navigating to LCR...');
  await page.goto('https://lcr.churchofjesuschrist.org', { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('🔗 Current URL:', page.url());

  const url = page.url();
  if (url.includes('lcr.churchofjesuschrist.org') && !url.includes('id.churchofjesuschrist.org')) {
    console.log('✅ Already on LCR.');
    return;
  }

  const username = process.env.LCR_USERNAME;
  const password = process.env.LCR_PASSWORD;

  if (url.includes('id.churchofjesuschrist.org') && username && password) {
    console.log('🔐 Attempting auto-login...');
    try {
      await page.waitForSelector('#username-input', { timeout: 15000 });
      await page.type('#username-input', username);
      await page.click('#button-primary');
      await page.waitForSelector('input[type="password"]', { timeout: 15000 });
      await page.type('input[type="password"]', password);
      await new Promise(r => setTimeout(r, 1000));
      const submit = await page.$('input[type="submit"], button[type="submit"], #button-primary');
      if (submit) await submit.click();
      else await page.keyboard.press('Enter');
    } catch (e) {
      console.log('⚠️ Auto-login failed:', e.message);
    }
  }

  console.log('⏳ Waiting for you to reach LCR (up to 5 min). Sign in manually in the browser if needed.');
  await waitForLCR(page);
  console.log('✅ On LCR.');
}

async function fetchInPage(page, url) {
  return await page.evaluate(async (u) => {
    const res = await fetch(u, { credentials: 'include', headers: { Accept: 'application/json' } });
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch (_) {
      body = text;
    }
    return {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      body
    };
  }, url);
}

async function main() {
  console.log('🚀 Manual LCR debug script');
  console.log('   Report ID from .env or default:', REPORT_ID);
  console.log('');

  const { browser, page } = await launchBrowser();

  try {
    await login(page);

    // Give the app a moment after login
    await new Promise(r => setTimeout(r, 3000));

    const base = 'https://lcr.churchofjesuschrist.org';
    const endpoints = [
      `${base}/api/report/custom-reports/list`,
      `${base}/api/report/custom-reports/available`,
      `${base}/api/report/custom-reports`,
      `${base}/mlt/report/create-a-report/custom-reports-details/${REPORT_ID}?lang=eng`,
      `${base}/mlt/report/create-a-report/criteria/${REPORT_ID}?lang=eng`,
      `${base}/mlt/report/create-a-report/criteria/${REPORT_ID}?_rsc=13ctg&lang=eng`,
      `${base}/mlt/api/report/custom-reports/run-report/${REPORT_ID}?lang=eng`,
      `${base}/api/mlt/report/custom-reports/run-report/${REPORT_ID}?lang=eng`,
      `${base}/mlt/report/create-a-report/custom-reports-run-report/${REPORT_ID}?lang=eng`,
      `${base}/api/report/custom-reports/run-report/${REPORT_ID}?lang=eng`
    ];

    for (const url of endpoints) {
      console.log('\n---');
      console.log('GET', url);
      const result = await fetchInPage(page, url);
      console.log('Status:', result.status, result.statusText);
      console.log('Body:', JSON.stringify(result.body, null, 2));
      if (result.status === 404 && typeof result.body === 'object' && result.body.message) {
        console.log('Message:', result.body.message);
      }
    }

    console.log('\n---');
    console.log('✅ Debug requests done. Browser will stay open 60 seconds so you can inspect.');
    await new Promise(r => setTimeout(r, 60000));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('💥', err);
  process.exit(1);
});

# LCR Login Page Updates

## Overview
The LCR login page has been updated with a new layout. This document outlines the changes made to the automation scripts to handle the new login flow.

## Changes Made

### 1. Updated Login Selectors
- **Username field**: Changed from `input[name="identifier"]` to `#username-input`
- **Next button**: Added support for `#button-primary` button
- **Password field**: Still uses `input[type="password"]`
- **Submit button**: Updated to handle both `input[type="submit"]` and `button[type="submit"]`

### 2. New Login Flow
The new LCR login process follows this pattern:
1. User enters username in `#username-input`
2. User clicks "Next" button (`#button-primary`)
3. Password field appears
4. User enters password
5. User submits the form

### 3. Updated Scripts

#### `scripts/fetchLCRData.js`
- Updated login logic to handle the new two-step login process
- Added support for the new selectors
- Improved error handling and debugging

#### `scripts/testLCRLogin.js` (NEW)
- Analyzes the current LCR login page structure
- Generates detailed analysis of forms, inputs, and buttons
- Saves screenshots and analysis data for debugging

#### `scripts/testLoginProcess.js` (NEW)
- Tests the complete login process with real credentials
- Takes screenshots at each step for debugging
- Provides detailed logging of the login flow

### 4. New NPM Scripts
```bash
npm run test-login           # Analyze current login page structure
npm run test-login-process   # Test complete login process
npm run fetch-lcr           # Fetch LCR data (updated)
```

## Testing the Updates

### Step 1: Analyze Current Login Page
```bash
npm run test-login
```
This will:
- Navigate to the LCR login page
- Analyze the page structure
- Save screenshots and analysis data
- Generate `lcr-login-analysis.json` and `lcr-login-current.png`

### Step 2: Test Login Process (Optional)
```bash
npm run test-login-process
```
This will:
- Test the complete login process with your credentials
- Take screenshots at each step
- Provide detailed debugging information
- Save multiple debug screenshots

### Step 3: Fetch LCR Data
```bash
npm run fetch-lcr
```
This will:
- Use the updated login process
- Fetch your LCR data
- Save as JSON and TSV files

## Debug Files Generated
- `lcr-login-current.png` - Screenshot of current login page
- `lcr-login-analysis.json` - Detailed analysis of page structure
- `debug-username-entered.png` - Screenshot after username entry
- `debug-after-next.png` - Screenshot after clicking Next
- `debug-password-page.png` - Screenshot of password page
- `debug-password-entered.png` - Screenshot after password entry
- `debug-login-success.png` - Screenshot after successful login
- `debug-login-test-error.png` - Screenshot if login fails

## Fallback Support
The updated scripts include fallback support for:
- Multiple username field selectors
- Multiple submit button selectors
- Different login page layouts
- Error handling and recovery

## Environment Variables Required
Make sure your `.env` file contains:
```
LCR_USERNAME=your_username
LCR_PASSWORD=your_password
LCR_REPORT_ID=your_report_id
```

## Notes
- The login process now requires two steps: username → Next → password → Submit
- All selectors have been updated to match the new LCR login page layout
- Debug screenshots are saved to help troubleshoot any issues
- The scripts are backward compatible with fallback selectors


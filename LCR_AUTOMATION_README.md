# LCR Automation Setup Guide

This guide will help you set up the Puppeteer-based automation system to fetch member data from LCR (Leader and Clerk Resources).

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your LCR credentials:

```bash
cp env.example .env
```

Edit the `.env` file and add your LCR credentials:

```env
LCR_USERNAME=your_lcr_username
LCR_PASSWORD=your_lcr_password

# Optional: Custom LCR report ID (default is the member report)
LCR_REPORT_ID=270dd333-769f-43a0-b73e-d27cc6d5d730

# Optional: Output file path for the fetched data
LCR_OUTPUT_FILE=./lcr-data.json
```

### 3. Run the Automation

```bash
npm run fetch-lcr
```

The script will:
- Open a browser window
- Navigate to LCR
- Log in with your credentials
- Fetch member data
- Save the data as both JSON and TSV files
- Close the browser

### 4. Import Data into the App

1. Open the app in your browser
2. Go to the Import page
3. Use the "Import from File" option to select the generated data file
4. Review and import the data

## 🔧 How It Works

### Architecture

The automation system consists of several components:

1. **Puppeteer Script** (`scripts/fetchLCRData.js`)
   - Handles browser automation
   - Manages login process
   - Fetches data from LCR API
   - Saves data to files

2. **Vue Service** (`src/services/lcrAutomationService.ts`)
   - Provides interface between Vue app and automation
   - Handles data conversion
   - Manages file imports

3. **Vue Component** (`src/components/LCRAutomationManager.vue`)
   - User interface for automation
   - File upload and import functionality
   - Status display and instructions

### Data Flow

```
User runs npm run fetch-lcr
    ↓
Puppeteer opens browser
    ↓
Navigates to LCR and logs in
    ↓
Fetches data from LCR API
    ↓
Saves data as JSON/TSV files
    ↓
User imports files via Vue app
    ↓
Data is processed and stored in database
```

## 🛠️ Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LCR_USERNAME` | Your LCR username | Required |
| `LCR_PASSWORD` | Your LCR password | Required |
| `LCR_REPORT_ID` | Custom report ID to fetch | `270dd333-769f-43a0-b73e-d27cc6d5d730` |
| `LCR_OUTPUT_FILE` | Output file path | `./lcr-data.json` |

### Script Options

The Puppeteer script can be configured by modifying `scripts/fetchLCRData.js`:

```javascript
// Browser options
this.browser = await puppeteer.launch({
  headless: false, // Set to true for production
  defaultViewport: { width: 1280, height: 720 },
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

## 🔒 Security Considerations

### Credential Storage

- Credentials are stored in a local `.env` file
- The `.env` file should be added to `.gitignore` to prevent accidental commits
- Never commit credentials to version control

### Browser Security

- The script runs in a controlled browser environment
- No data is sent to external servers (except LCR)
- All data processing happens locally

## 🐛 Troubleshooting

### Common Issues

#### 1. Login Fails

**Symptoms**: Script fails with "Login failed" error

**Solutions**:
- Verify your credentials are correct
- Check if LCR requires additional authentication (2FA, etc.)
- Try running the script with `headless: false` to see what's happening

#### 2. Browser Won't Start

**Symptoms**: Script fails to launch browser

**Solutions**:
- Ensure Puppeteer is installed: `npm install puppeteer`
- On Linux, you may need additional dependencies:
  ```bash
  sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
  ```

#### 3. Data Fetch Fails

**Symptoms**: Login succeeds but data fetch fails

**Solutions**:
- Check if the report ID is correct
- Verify you have access to the report in LCR
- Try running with `headless: false` to see the browser state

#### 4. File Import Fails

**Symptoms**: Can't import generated files

**Solutions**:
- Check file format (should be .json or .tsv)
- Verify file permissions
- Try copying the file content manually

### Debug Mode

To run in debug mode with visible browser:

```javascript
// In scripts/fetchLCRData.js, change:
headless: false, // This shows the browser window
```

### Screenshots

The script automatically takes screenshots on errors:
- `debug-login-error.png` - Login failure screenshot
- `debug-fetch-error.png` - Data fetch failure screenshot

## 📝 Development

### Adding New Reports

To fetch different reports, update the `LCR_REPORT_ID` in your `.env` file or modify the script.

### Customizing Data Processing

The data conversion happens in `LCRAutomationService.convertLCRDataToImportFormat()`. Modify this method to handle different data formats.

### Production Deployment

For production use:

1. Set `headless: true` in the Puppeteer options
2. Implement proper error handling and logging
3. Consider using a backend API instead of direct script execution
4. Add rate limiting to avoid overwhelming LCR servers

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console output for error messages
3. Check the generated screenshot files for visual debugging
4. Verify your LCR credentials and permissions

## 🔄 Migration from Old System

The new automation system replaces the old popup-based approach. Benefits:

- ✅ More reliable (no CORS issues)
- ✅ Better error handling
- ✅ Automated login process
- ✅ File-based data storage
- ✅ Easier debugging
- ✅ Production-ready

The old popup-based files can be removed:
- `public/lcr-login.html`
- `public/lcr-fetch.html`
- `src/services/lcrAuthService.ts` (parts related to popup)
- `src/services/lcrService.ts` (parts related to popup) 
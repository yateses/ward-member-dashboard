#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to run LCR automation
app.post('/api/run-lcr-automation', async (req, res) => {
  try {
    console.log('🚀 Starting LCR automation via API...');
    
    // Run the automation script
    const result = await runAutomationScript();
    
    if (result.success) {
      // Read the generated data file
      const dataPath = path.join(__dirname, '../lcr-data.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const jsonData = JSON.parse(data);
      
      res.json({
        success: true,
        message: 'LCR automation completed successfully',
        data: jsonData,
        memberCount: jsonData.members?.length || 0
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Automation failed'
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Helper function to run the automation script
function runAutomationScript() {
  return new Promise((resolve) => {
    console.log('📝 Running automation script directly...');
    
    // Run the script directly with node instead of npm
    const scriptPath = path.join(__dirname, 'fetchLCRData.js');
    const cwd = path.join(__dirname, '..');
    
    console.log('📁 Script path:', scriptPath);
    console.log('📁 Working directory:', cwd);
    
    const child = spawn('node', [scriptPath], {
      cwd: cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false // Don't use shell to avoid path issues
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('📤 Script output:', data.toString());
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('❌ Script error:', data.toString());
    });
    
    child.on('close', (code) => {
      console.log(`📝 Script exited with code ${code}`);
      
      if (code === 0) {
        resolve({
          success: true,
          stdout,
          stderr
        });
      } else {
        resolve({
          success: false,
          error: `Script failed with exit code ${code}`,
          stdout,
          stderr
        });
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ Script execution error:', error);
      resolve({
        success: false,
        error: error.message
      });
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'LCR Automation API',
    version: '1.0.0'
  });
});

// Startup endpoint (for checking if server can be started)
app.post('/api/start', (req, res) => {
  res.json({ 
    status: 'running', 
    message: 'API server is already running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LCR Automation API server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/run-lcr-automation`);
});

export default app; 
<template>
  <div class="lcr-automation-manager">
    <div class="automation-card">
      <h3>🤖 LCR Automation</h3>
      
      <!-- Status Display -->
      <div class="status-section">
        <div class="status-item">
          <span class="status-label">Automation Status:</span>
          <span class="status-value" :class="{ 'available': isAvailable }">
            {{ isAvailable ? '🟢 Available' : '🔴 Not Available' }}
          </span>
        </div>
        
        <div v-if="lastRun" class="status-item">
          <span class="status-label">Last Run:</span>
          <span class="status-value">{{ formatDate(lastRun) }}</span>
        </div>
      </div>

      <!-- One-Click Automation -->
      <div class="one-click-section">
        <h4>⚡ One-Click Import</h4>
        <p>Automatically fetch and import LCR data with a single click:</p>
        
        <button 
          @click="runOneClickAutomation" 
          :disabled="isRunningAutomation"
          class="btn btn-primary one-click-btn"
        >
          {{ isRunningAutomation ? '🔄 Running Automation...' : '🚀 One-Click Import' }}
        </button>
        
        <div v-if="automationStatus" class="automation-status">
          <p>{{ automationStatus }}</p>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <h4>📋 Manual Steps (Alternative):</h4>
        <ol>
          <li>Create a <code>.env</code> file in your project root with your LCR credentials</li>
          <li>Run <code>npm run fetch-lcr</code> in your terminal</li>
          <li>The script will automatically log in and fetch your member data</li>
          <li>Data will be saved as both JSON and TSV files</li>
          <li>Use the "Import from File" option below to import the data</li>
        </ol>
      </div>

      <!-- File Import Section -->
      <div class="file-import-section">
        <h4>📁 Import Generated Data</h4>
        <p>After running the automation script, import the generated data file:</p>
        
        <div class="file-input-group">
          <label for="data-file">Select LCR data file:</label>
          <input
            id="data-file"
            type="file"
            accept=".json,.tsv,.txt"
            @change="handleFileSelect"
            class="file-input"
          />
          <button 
            @click="importSelectedFile" 
            :disabled="!selectedFile || isImporting"
            class="btn btn-primary"
          >
            {{ isImporting ? 'Importing...' : 'Import Data' }}
          </button>
        </div>
      </div>

      <!-- Manual Script Execution -->
      <div class="script-section">
        <h4>⚡ Manual Execution</h4>
        <p>Run the automation script manually:</p>
        
        <div class="command-box">
          <code>npm run fetch-lcr</code>
          <button @click="copyCommand" class="copy-btn">📋</button>
        </div>
        
        <div class="script-actions">
          <button @click="showInstructions = !showInstructions" class="btn btn-secondary">
            {{ showInstructions ? 'Hide' : 'Show' }} Setup Instructions
          </button>
        </div>
        
        <div v-if="showInstructions" class="setup-instructions">
          <h5>🔧 Setup Instructions:</h5>
          <ol>
            <li>Copy <code>env.example</code> to <code>.env</code></li>
            <li>Edit <code>.env</code> and add your LCR credentials:
              <pre><code>LCR_USERNAME=your_username
LCR_PASSWORD=your_password</code></pre>
            </li>
            <li>Install dependencies: <code>npm install</code></li>
            <li>Run the script: <code>npm run fetch-lcr</code></li>
          </ol>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-message">
        <span>{{ error }}</span>
        <button @click="clearError" class="error-close">×</button>
      </div>

      <!-- Success Display -->
      <div v-if="importSuccess" class="success-message">
        <span>✅ Data imported successfully! {{ importedCount }} members processed.</span>
        <button @click="clearSuccess" class="success-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { LCRAutomationService, type LCRAutomationResult } from '../services/lcrAutomationService'
import { parseClipboardData } from '../utils/dataParser'
import type { MemberImportData } from '../types/member'

// Props
interface Props {
  onDataImported?: (data: MemberImportData[]) => void
}

const props = withDefaults(defineProps<Props>(), {
  onDataImported: () => {}
})

// Reactive data
const isAvailable = ref(false)
const lastRun = ref<Date | null>(null)
const selectedFile = ref<File | null>(null)
const isImporting = ref(false)
const error = ref<string | null>(null)
const importSuccess = ref(false)
const importedCount = ref(0)
const showInstructions = ref(false)
const isRunningAutomation = ref(false)
const automationStatus = ref<string | null>(null)

// Computed properties
const canImport = computed(() => {
  return selectedFile.value && !isImporting.value
})

// Methods
const checkAvailability = async () => {
  try {
    const status = await LCRAutomationService.getStatus()
    isAvailable.value = status.available
    lastRun.value = status.lastRun || null
  } catch (err) {
    console.error('Failed to check automation status:', err)
    isAvailable.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    clearError()
  }
}

const importSelectedFile = async () => {
  if (!selectedFile.value) return

  try {
    isImporting.value = true
    clearError()
    clearSuccess()

    const fileContent = await readFileContent(selectedFile.value)
    const data = parseFileContent(fileContent, selectedFile.value.name)
    
    importedCount.value = data.length
    importSuccess.value = true
    
    // Call the parent callback
    props.onDataImported(data)
    
    console.log(`✅ Imported ${data.length} members from file`)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to import file'
    console.error('Import error:', err)
  } finally {
    isImporting.value = false
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

const parseFileContent = (content: string, filename: string): MemberImportData[] => {
  if (filename.endsWith('.json')) {
    // Parse JSON file
    try {
      const jsonData = JSON.parse(content)
      return LCRAutomationService.convertLCRDataToImportFormat(jsonData)
    } catch (err) {
      throw new Error('Invalid JSON file format')
    }
  } else if (filename.endsWith('.tsv') || filename.endsWith('.txt')) {
    // Parse TSV file
    return parseClipboardData(content)
  } else {
    throw new Error('Unsupported file format. Please use .json, .tsv, or .txt files.')
  }
}

const runOneClickAutomation = async () => {
  try {
    isRunningAutomation.value = true
    automationStatus.value = '🚀 Starting automation...'
    clearError()
    clearSuccess()

    console.log('🚀 Starting one-click LCR automation...')
    
    const result = await LCRAutomationService.runOneClickAutomation()
    
    if (result.success && result.data) {
      automationStatus.value = `✅ Success! ${result.memberCount} members imported.`
      importedCount.value = result.memberCount || 0
      importSuccess.value = true
      
      // Call the parent callback
      props.onDataImported(result.data)
      
      console.log(`✅ One-click automation completed: ${result.memberCount} members`)
    } else {
      error.value = result.message || 'Automation failed'
      automationStatus.value = null
      console.error('❌ One-click automation failed:', result.message)
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'One-click automation failed'
    automationStatus.value = null
    console.error('❌ One-click automation error:', err)
  } finally {
    isRunningAutomation.value = false
  }
}

const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText('npm run fetch-lcr')
    // You could show a toast notification here
    console.log('Command copied to clipboard')
  } catch (err) {
    console.error('Failed to copy command:', err)
  }
}

const clearError = () => {
  error.value = null
}

const clearSuccess = () => {
  importSuccess.value = false
  importedCount.value = 0
}

const formatDate = (date: Date): string => {
  return date.toLocaleString()
}

// Initialize on mount
onMounted(() => {
  checkAvailability()
})
</script>

<style scoped>
.lcr-automation-manager {
  margin: 1rem 0;
}

.automation-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
}

.automation-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.status-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-weight: 600;
  color: #6c757d;
}

.status-value {
  font-weight: 600;
  color: #2c3e50;
}

.status-value.available {
  color: #27ae60;
}

.instructions {
  background: #e8f4fd;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.instructions h4 {
  color: #0c5460;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.instructions ol {
  margin: 0;
  padding-left: 1.5rem;
  color: #0c5460;
}

.instructions li {
  margin-bottom: 0.5rem;
}

.instructions code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.one-click-section {
  background: #e8f5e8;
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
}

.one-click-section h4 {
  color: #2e7d32;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.one-click-section p {
  color: #388e3c;
  margin-bottom: 1rem;
}

.one-click-btn {
  font-size: 1.1rem;
  padding: 1rem 2rem;
  background: #4caf50;
  border: none;
  color: white;
  font-weight: bold;
  transition: all 0.3s;
}

.one-click-btn:hover:not(:disabled) {
  background: #388e3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.one-click-btn:disabled {
  background: #9e9e9e;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.automation-status {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f0f8f0;
  border-radius: 4px;
  color: #2e7d32;
  font-weight: 600;
}

.file-import-section {
  margin: 1.5rem 0;
}

.file-import-section h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.file-input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.file-input-group label {
  font-weight: 600;
  color: #2c3e50;
}

.file-input {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.file-input:focus {
  outline: none;
  border-color: #3498db;
}

.script-section {
  margin: 1.5rem 0;
}

.script-section h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.command-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2c3e50;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: 'Courier New', monospace;
}

.command-box code {
  flex: 1;
}

.copy-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.copy-btn:hover {
  background: #2980b9;
}

.script-actions {
  margin: 1rem 0;
}

.setup-instructions {
  background: #fff8e1;
  border: 1px solid #ffd54f;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.setup-instructions h5 {
  color: #f57c00;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.setup-instructions ol {
  margin: 0;
  padding-left: 1.5rem;
  color: #5d4037;
}

.setup-instructions pre {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.setup-instructions code {
  font-family: 'Courier New', monospace;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-close,
.success-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .automation-card {
    padding: 1rem;
  }
  
  .file-input-group {
    flex-direction: column;
  }
  
  .command-box {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 
<template>
  <div class="import-view">
    <header class="import-header">
      <h1>Import LCR Data</h1>
      <p>Paste your LCR report data from the clipboard to import congregation members</p>
    </header>

    <!-- Error Display -->
    <div v-if="memberStore.error" class="error-banner">
      <div class="error-content">
        <span>{{ memberStore.error }}</span>
        <button @click="memberStore.clearError()" class="error-close">×</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="memberStore.loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Importing data...</p>
    </div>

    <div class="import-container">
      <!-- Step 1: Data Input -->
      <div v-if="!parsedData.length" class="step-section">
        <h2>Step 1: Get LCR Data</h2>
        <p>You can either use the automatic data extractor or manually paste your data:</p>
        
        <div class="data-source-options">
          <div class="option-card">
            <h3>🤖 LCR Automation (Recommended)</h3>
            <p>Use Puppeteer automation to fetch data directly from LCR:</p>
            
            <LCRAutomationManager @data-imported="handleAutomationData" />
          </div>
          
          <div class="option-card">
            <h3>📋 Manual Paste</h3>
            <p>Copy and paste your LCR data manually:</p>
            <div class="input-section">
              <label for="clipboard-data">Paste your LCR report data here:</label>
              <textarea
                id="clipboard-data"
                v-model="clipboardData"
                placeholder="Paste the tab-separated data from your LCR report here..."
                rows="8"
                class="data-textarea"
              ></textarea>
              
              <div class="button-group">
                <button 
                  @click="parseData" 
                  :disabled="!clipboardData.trim()"
                  class="btn btn-primary"
                >
                  Parse Data
                </button>
                <button 
                  @click="clearData" 
                  :disabled="!clipboardData.trim()"
                  class="btn btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Data Preview -->
      <div v-if="parsedData.length && !importComplete" class="step-section">
        <h2>Step 2: Review Data</h2>
        
        <!-- Validation Errors -->
        <div v-if="validationErrors.length" class="validation-errors">
          <h3>Validation Errors</h3>
          <ul>
            <li v-for="error in validationErrors" :key="error" class="error-item">
              {{ error }}
            </li>
          </ul>
          <button @click="goBackToInput" class="btn btn-secondary">
            Go Back & Fix
          </button>
        </div>

        <!-- Data Summary -->
        <div v-if="!validationErrors.length" class="data-summary">
          <h3>Import Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total Records:</span>
              <span class="summary-value">{{ importSummary.totalRecords }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Households:</span>
              <span class="summary-value">{{ importSummary.households }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Children (0-17):</span>
              <span class="summary-value">{{ importSummary.ageGroups.children }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Youth (18-29):</span>
              <span class="summary-value">{{ importSummary.ageGroups.youth }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Adults (30+):</span>
              <span class="summary-value">{{ importSummary.ageGroups.adults }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Male:</span>
              <span class="summary-value">{{ importSummary.genderBreakdown.male }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Female:</span>
              <span class="summary-value">{{ importSummary.genderBreakdown.female }}</span>
            </div>
          </div>

          <!-- Duplicate Information -->
          <div v-if="duplicateInfo" class="duplicate-info">
            <h3>Import Analysis</h3>
            <div class="duplicate-summary">
              <div class="summary-item">
                <span class="summary-label">New Members:</span>
                <span class="summary-value new">{{ duplicateInfo.newMembers }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Existing Members (will be updated):</span>
                <span class="summary-value existing">{{ duplicateInfo.existingMembers }}</span>
              </div>
            </div>
            
            <div v-if="duplicateInfo.potentialDuplicates.length > 0" class="duplicate-list">
              <h4>Members that will be updated:</h4>
              <ul>
                <li v-for="duplicate in duplicateInfo.potentialDuplicates.slice(0, 10)" :key="duplicate.existingId">
                  {{ duplicate.name }} ({{ duplicate.headOfHouse }})
                </li>
                <li v-if="duplicateInfo.potentialDuplicates.length > 10">
                  ... and {{ duplicateInfo.potentialDuplicates.length - 10 }} more
                </li>
              </ul>
            </div>
          </div>

          <!-- Sample Data Preview -->
          <div class="data-preview">
            <h3>Sample Data (First 5 Records)</h3>
            <div class="preview-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Head of House</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in sampleData" :key="member.PREFERRED_NAME">
                    <td>{{ member.PREFERRED_NAME }}</td>
                    <td>{{ member.HEAD_OF_HOUSE }}</td>
                    <td>{{ member.AGE }}</td>
                    <td>{{ member.GENDER }}</td>
                    <td>{{ member.ADDRESS_STREET_1 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Import Actions -->
          <div class="import-actions">
            <button @click="goBackToInput" class="btn btn-secondary">
              Go Back
            </button>
            <button 
              @click="importData" 
              :disabled="validationErrors.length > 0"
              class="btn btn-primary"
            >
              Import Data
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Import Complete -->
      <div v-if="importComplete" class="step-section">
        <div class="success-message">
          <div class="success-icon">✅</div>
          <h2>Import Complete!</h2>
          <p v-if="importResult.success > 0">{{ importResult.success }} new members were successfully imported.</p>
          <p v-if="importResult.updated > 0">{{ importResult.updated }} existing members were updated.</p>
          <p v-if="importResult.success === 0 && importResult.updated === 0">No new members were imported or updated.</p>
          
          <div v-if="importResult.errors.length" class="import-errors">
            <h3>Import Errors</h3>
            <ul>
              <li v-for="error in importResult.errors" :key="error" class="error-item">
                {{ error }}
              </li>
            </ul>
          </div>

          <div class="success-actions">
            <router-link to="/" class="btn btn-primary">
              Go to Dashboard
            </router-link>
            <button @click="startNewImport" class="btn btn-secondary">
              Import More Data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from '../stores/memberStore'
import { parseClipboardData, validateImportData, formatImportSummary } from '../utils/dataParser'
import { MemberService } from '../services/memberService'
import { LCRService } from '../services/lcrService'
import { LCRAuthService } from '../services/lcrAuthService'
import LCRAutomationManager from '../components/LCRAutomationManager.vue'
import type { MemberImportData } from '../types/member'

const memberStore = useMemberStore()

// Reactive data
const clipboardData = ref('')
const parsedData = ref<MemberImportData[]>([])
const importComplete = ref(false)
const importResult = ref<{ success: number; updated: number; errors: string[] }>({ success: 0, updated: 0, errors: [] })
const duplicateInfo = ref<{ newMembers: number; existingMembers: number; potentialDuplicates: Array<{ name: string; headOfHouse: string; existingId?: string }> } | null>(null)
const isLCRConnected = ref(false)
const isFetchingLCR = ref(false)
const isLoggingIn = ref(false)
const showConsoleInstructions = ref(false)

// Computed properties
const validationErrors = computed(() => {
  if (!parsedData.value.length) return []
  const validation = validateImportData(parsedData.value)
  return validation.errors
})

const importSummary = computed(() => {
  if (!parsedData.value.length) return {
    totalRecords: 0,
    households: 0,
    ageGroups: { children: 0, youth: 0, adults: 0 },
    genderBreakdown: { male: 0, female: 0 }
  }
  return formatImportSummary(parsedData.value)
})

const sampleData = computed(() => {
  return parsedData.value.slice(0, 5)
})

// Methods
const parseData = async () => {
  try {
    parsedData.value = parseClipboardData(clipboardData.value)
    // Check for duplicates after parsing
    if (parsedData.value.length > 0) {
      duplicateInfo.value = await MemberService.checkImportDuplicates(parsedData.value)
    }
  } catch (error) {
    memberStore.error = `Failed to parse data: ${error}`
  }
}

const clearData = () => {
  clipboardData.value = ''
  parsedData.value = []
  importComplete.value = false
  importResult.value = { success: 0, updated: 0, errors: [] }
  duplicateInfo.value = null
  memberStore.clearError()
}

const goBackToInput = () => {
  parsedData.value = []
  importComplete.value = false
  importResult.value = { success: 0, updated: 0, errors: [] }
  duplicateInfo.value = null
}

const importData = async () => {
  try {
    const result = await memberStore.importMembers(parsedData.value)
    importResult.value = result
    importComplete.value = true
  } catch (error) {
    memberStore.error = `Import failed: ${error}`
  }
}

const openLoginPopup = async () => {
  try {
    isLoggingIn.value = true
    memberStore.clearError()
    
    const success = await LCRAuthService.openLCRLoginPopup()
    
    if (success) {
      isLCRConnected.value = true
      memberStore.clearError()
    } else {
      memberStore.error = 'Login was cancelled or failed. Please try again.'
    }
  } catch (error) {
    memberStore.error = `Login failed: ${error}`
  } finally {
    isLoggingIn.value = false
  }
}

const markAsLoggedIn = () => {
  console.log('markAsLoggedIn called')
  isLCRConnected.value = true
  memberStore.clearError()
  memberStore.error = null
  console.log('isLCRConnected set to:', isLCRConnected.value)
  
  // Close any existing popup
  const popup = window.open('', 'LCR_Login')
  if (popup && !popup.closed) {
    popup.close()
  }
  
  // Clear any existing errors and trigger data fetch
  setTimeout(() => {
    console.log('Triggering direct data fetch...')
    fetchLCRData()
  }, 100)
}

const checkLCRConnection = async () => {
  try {
    isLCRConnected.value = await LCRService.checkLCRLogin()
    if (isLCRConnected.value) {
      memberStore.clearError()
    } else {
      memberStore.error = 'Not connected to LCR. Please use the "Login to LCR" button to log in.'
    }
  } catch (error) {
    memberStore.error = `Failed to check LCR connection: ${error}`
  }
}



const openLCRWithScript = () => {
  try {
    console.log('Opening LCR fetch page in new tab...')
    
    // Open our fetch page in a new tab
    const newTab = window.open('/lcr-fetch.html', '_blank')
    
    if (!newTab) {
      throw new Error('New tab was blocked by browser. Please allow popups for this site and try again.')
    }
    
    console.log('LCR fetch tab opened successfully')
    
  } catch (error) {
    console.error('Error opening LCR fetch tab:', error)
    memberStore.error = `Failed to open LCR fetch tab: ${error}`
  }
}

const startNewImport = () => {
  clearData()
}

const handleAutomationData = (data: MemberImportData[]) => {
  console.log('Received automation data:', data.length, 'members')
  parsedData.value = data
  
  // Check for duplicates after parsing
  if (parsedData.value.length > 0) {
    MemberService.checkImportDuplicates(parsedData.value).then(duplicates => {
      duplicateInfo.value = duplicates
    })
  }
}

// Check LCR connection when component mounts
onMounted(() => {
  checkLCRConnection()
  
  // Listen for messages from popup
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'LCR_DATA_FETCHED') {
      console.log('LCR data received from popup:', event.data.data)
      
      const data = event.data.data
      
      // Convert the data to the expected format
      const convertedData = data.members.map((member: any) => {
        const row: any = {}
        data.columns.forEach((column: any, index: number) => {
          row[column.key] = member[column.key] || ''
        })
        return row
      })
      
      // Convert to tab-separated format
      const headers = data.columns.map((col: any) => col.key)
      const rows = [headers, ...convertedData.map((row: any) => 
        headers.map(header => row[header] || '').join('\t')
      )]
      
      clipboardData.value = rows.join('\n')
      console.log('Data converted and set to clipboard')
      
      // Parse the data automatically
      parseData()
      
      isFetchingLCR.value = false
    } else if (event.data && event.data.type === 'LCR_DATA_ERROR') {
      console.error('LCR data fetch error:', event.data.error)
      memberStore.error = `Failed to fetch LCR data: ${event.data.error}`
      isFetchingLCR.value = false
    }
  })
})
</script>

<style scoped>
.import-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.import-header {
  text-align: center;
  margin-bottom: 3rem;
}

.import-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.import-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.error-banner {
  background-color: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.import-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.step-section {
  padding: 2rem;
}

.step-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.data-source-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
}

.option-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.option-card h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 1rem;
}

.option-card p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.option-card small {
  color: #6c757d;
  font-style: italic;
}

.login-instructions {
  background: #e8f4fd;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.login-instructions h4 {
  color: #0c5460;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.login-instructions ol {
  margin: 0;
  padding-left: 1.5rem;
  color: #0c5460;
}

.login-instructions li {
  margin-bottom: 0.5rem;
}

.lcr-status {
  margin: 1rem 0;
}

.lcr-status p {
  margin: 0.5rem 0;
  font-weight: 600;
}

.login-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cors-note {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.cors-note details {
  text-align: left;
}

.cors-note summary {
  cursor: pointer;
  color: #3498db;
  font-weight: 600;
}

.cors-note ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.cors-note code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-section label {
  font-weight: 600;
  color: #2c3e50;
}

.data-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 200px;
}

.data-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.validation-errors {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.validation-errors h3 {
  color: #856404;
  margin-top: 0;
  margin-bottom: 1rem;
}

.error-item {
  color: #856404;
  margin-bottom: 0.5rem;
}

.data-summary {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.data-summary h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-label {
  font-weight: 500;
  color: #2c3e50;
}

.summary-value {
  font-weight: 600;
  color: #3498db;
}

.summary-value.new {
  color: #27ae60;
}

.summary-value.existing {
  color: #f39c12;
}

.duplicate-info {
  background: #fff8e1;
  border: 1px solid #ffd54f;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.duplicate-info h3 {
  color: #f57c00;
  margin-top: 0;
  margin-bottom: 1rem;
}

.duplicate-info h4 {
  color: #e65100;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.duplicate-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.duplicate-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.duplicate-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #ffecb3;
  color: #5d4037;
}

.duplicate-list li:last-child {
  border-bottom: none;
}

.data-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.preview-table {
  overflow-x: auto;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.preview-table th,
.preview-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.preview-table th {
  background: #e9ecef;
  font-weight: 600;
  color: #2c3e50;
}

.preview-table td {
  color: #495057;
}

.import-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.success-message {
  text-align: center;
  padding: 3rem 2rem;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-message h2 {
  color: #27ae60;
  margin-bottom: 1rem;
}

.success-message p {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.import-errors {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.import-errors h3 {
  color: #856404;
  margin-top: 0;
  margin-bottom: 1rem;
}

.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .import-view {
    padding: 1rem;
  }
  
  .step-section {
    padding: 1rem;
  }
  
  .data-source-options {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .option-card {
    padding: 1.5rem;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group,
  .import-actions,
  .success-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 
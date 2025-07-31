<template>
  <div class="credentials-manager">
    <div class="credentials-card">
      <h3>🔐 LCR Credentials</h3>
      
      <!-- Show stored credentials status -->
      <div v-if="hasStoredCredentials" class="credentials-status">
        <div class="status-item">
          <span class="status-label">Username:</span>
          <span class="status-value">{{ maskedUsername }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Status:</span>
          <span class="status-value" :class="{ 'connected': isConnected }">
            {{ isConnected ? '🟢 Connected' : '🔴 Not Connected' }}
          </span>
        </div>
        <div class="credentials-actions">
          <button @click="testConnection" :disabled="isTesting" class="btn btn-secondary">
            {{ isTesting ? 'Testing...' : 'Test Connection' }}
          </button>
          <button @click="clearCredentials" class="btn btn-danger">
            Clear Credentials
          </button>
        </div>
      </div>

      <!-- Credentials form -->
      <div v-else class="credentials-form">
        <p>Enter your LCR credentials to enable automatic login:</p>
        
        <div class="form-group">
          <label for="username">Username:</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            placeholder="Your LCR username"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password:</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            placeholder="Your LCR password"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <small class="form-help">
            🔐 Uses the official Church OAuth2 authentication system at id.churchofjesuschrist.org
          </small>
        </div>
        
        <div class="form-actions">
          <button @click="saveCredentials" :disabled="!isValidCredentials" class="btn btn-primary">
            Save Credentials
          </button>
        </div>
        
        <div class="security-note">
          <small>
            🔒 Your credentials are stored locally in your browser and are not sent to any server.
            They are only used to automatically log you into LCR.
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { LCRAuthService, type LCRCredentials } from '../services/lcrAuthService'

// Props
interface Props {
  onCredentialsSaved?: () => void
  onConnectionTested?: (success: boolean) => void
}

const props = withDefaults(defineProps<Props>(), {
  onCredentialsSaved: () => {},
  onConnectionTested: () => {}
})

// Reactive data
const credentials = ref<LCRCredentials>({
  username: '',
  password: ''
})

const isTesting = ref(false)
const isConnected = ref(false)

// Computed properties
const hasStoredCredentials = computed(() => {
  return LCRAuthService.hasCredentials()
})

const isValidCredentials = computed(() => {
  return credentials.value.username.trim() && credentials.value.password.trim()
})

const maskedUsername = computed(() => {
  const stored = LCRAuthService.getCredentials()
  if (!stored) return ''
  
  const username = stored.username
  if (username.length <= 4) return username
  
  return username.substring(0, 2) + '*'.repeat(username.length - 4) + username.substring(username.length - 2)
})

// Methods
const saveCredentials = async () => {
  try {
    LCRAuthService.saveCredentials(credentials.value)
    
    // Test the connection immediately
    await testConnection()
    
    // Clear the form
    credentials.value = { username: '', password: '' }
    
    props.onCredentialsSaved()
  } catch (error) {
    console.error('Failed to save credentials:', error)
    alert('Failed to save credentials. Please try again.')
  }
}

const testConnection = async () => {
  try {
    isTesting.value = true
    
    // Try to auto-login
    const success = await LCRAuthService.autoLogin()
    isConnected.value = success
    
    props.onConnectionTested(success)
    
    if (success) {
      console.log('✅ Successfully connected to LCR')
    } else {
      console.log('❌ Failed to connect to LCR')
    }
  } catch (error) {
    console.error('Connection test failed:', error)
    isConnected.value = false
    props.onConnectionTested(false)
  } finally {
    isTesting.value = false
  }
}

const clearCredentials = () => {
  if (confirm('Are you sure you want to clear your stored credentials?')) {
    LCRAuthService.clearCredentials()
    isConnected.value = false
    props.onCredentialsSaved()
  }
}

// Check connection status on mount
onMounted(async () => {
  if (hasStoredCredentials.value) {
    await testConnection()
  }
})
</script>

<style scoped>
.credentials-manager {
  margin: 1rem 0;
}

.credentials-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
}

.credentials-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.credentials-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.status-value.connected {
  color: #27ae60;
}

.credentials-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.credentials-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-help {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.security-note {
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f5e8;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
}

.security-note small {
  color: #2c3e50;
  line-height: 1.4;
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

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

@media (max-width: 768px) {
  .credentials-actions {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 
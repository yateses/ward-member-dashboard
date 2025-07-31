<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>FH5 Members</h1>
        <p>Sign in to access the congregation manager</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Enter your password"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="login-button"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Protected access for authorized users only</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services/authService'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const emit = defineEmits<{
  loginSuccess: []
}>()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authService.login(email.value, password.value)
    emit('loginSuccess')
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a5f7a 0%, #2980b9 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #1a5f7a;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
}

.login-header p {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #1a5f7a;
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid #fed7d7;
}

.login-button {
  background: #1a5f7a;
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-button:hover:not(:disabled) {
  background: #134b5f;
}

.login-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.login-footer p {
  color: #95a5a6;
  font-size: 0.85rem;
  margin: 0;
}
</style> 
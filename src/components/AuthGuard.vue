<template>
  <div>
    <div v-if="loading" class="auth-loading">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <LoginForm
      v-else-if="!isAuthenticated"
      @login-success="handleLoginSuccess"
    />

    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { authService } from '@/services/authService'
import { getCredentials, clearCredentials } from '@/services/nativeCredentialStorage'
import LoginForm from './LoginForm.vue'

const loading = ref(true)
const loadingMessage = ref('Loading...')
const isAuthenticated = ref(false)

const handleLoginSuccess = () => {
  isAuthenticated.value = true
}

onMounted(async () => {
  const checkAuth = () => {
    if (authService.isAuthenticated()) {
      isAuthenticated.value = true
      loading.value = false
      return
    }
    if (!Capacitor.isNativePlatform()) {
      loading.value = false
      return
    }
    tryAutoLogin()
  }
  setTimeout(checkAuth, 100)
})

async function tryAutoLogin() {
  const stored = await getCredentials()
  if (!stored) {
    loading.value = false
    return
  }
  loadingMessage.value = 'Signing in...'
  try {
    await authService.login(stored.email, stored.password)
    isAuthenticated.value = true
  } catch {
    await clearCredentials()
  }
  loading.value = false
}
</script>

<style scoped>
.auth-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a5f7a 0%, #2980b9 100%);
  color: white;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-loading p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}
</style> 
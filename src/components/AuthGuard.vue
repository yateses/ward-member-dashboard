<template>
  <div>
    <!-- Show loading spinner while checking auth state -->
    <div v-if="loading" class="auth-loading">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Show login form if not authenticated -->
    <LoginForm 
      v-else-if="!isAuthenticated" 
      @login-success="handleLoginSuccess" 
    />

    <!-- Show main app if authenticated -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authService } from '@/services/authService'
import LoginForm from './LoginForm.vue'

const loading = ref(true)
const isAuthenticated = ref(false)

const handleLoginSuccess = () => {
  isAuthenticated.value = true
}

onMounted(() => {
  // Check if user is already authenticated
  const checkAuth = () => {
    isAuthenticated.value = authService.isAuthenticated()
    loading.value = false
  }

  // Small delay to ensure Firebase auth is initialized
  setTimeout(checkAuth, 100)
})
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
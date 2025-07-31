<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import { authService } from '@/services/authService'
import AuthGuard from '@/components/AuthGuard.vue'

const loading = ref(false)

const handleLogout = async () => {
  loading.value = true
  try {
    await authService.logout()
    // The AuthGuard will automatically redirect to login
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthGuard>
    <div id="app">
      <header class="app-header">
        <div class="header-content">
          <div class="logo">
            <h1>FH5 Members</h1>
          </div>
          
          <nav class="main-nav">
            <RouterLink to="/daily" class="nav-link">
              <span class="nav-icon">📅</span>
              Daily
            </RouterLink>
            <RouterLink to="/maps" class="nav-link">
              <span class="nav-icon">🗺️</span>
              Maps
            </RouterLink>
            <RouterLink to="/families" class="nav-link">
              <span class="nav-icon">👨‍👩‍👧‍👦</span>
              Families
            </RouterLink>
            <RouterLink to="/members" class="nav-link">
              <span class="nav-icon">👥</span>
              Members
            </RouterLink>
            <RouterLink to="/youth" class="nav-link">
              <span class="nav-icon">👨‍🦱</span>
              Youth
            </RouterLink>
            <RouterLink to="/" class="nav-link">
              <span class="nav-icon">📊</span>
              Dashboard
            </RouterLink>
            <RouterLink to="/import" class="nav-link">
              <span class="nav-icon">📥</span>
              Import
            </RouterLink>
            
            <button 
              @click="handleLogout" 
              class="logout-button"
              :disabled="loading"
            >
              <span class="nav-icon">🚪</span>
              {{ loading ? 'Logging out...' : 'Logout' }}
            </button>
          </nav>
        </div>
      </header>

      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </AuthGuard>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  color: #2c3e50;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1a5f7a 0%, #2c7a9b 100%);
  box-shadow: 0 2px 8px rgba(26, 95, 122, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.header-content {
  width: 100%;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.logo h1 {
  font-size: 1.5rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.main-nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  font-size: 1.2rem;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}

.logout-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.logout-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.app-main {
  flex: 1;
  padding: 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  

  
  .main-nav {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-link {
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>

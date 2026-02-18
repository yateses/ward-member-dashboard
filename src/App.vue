<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { authService } from '@/services/authService'
import { clearCredentials } from '@/services/nativeCredentialStorage'
import AuthGuard from '@/components/AuthGuard.vue'
import NativeNotificationBootstrap from '@/components/NativeNotificationBootstrap.vue'

const route = useRoute()
const isNativeApp = computed(() => Capacitor.isNativePlatform())
const isDailyRoute = computed(() => route.path === '/' || route.path === '/daily')
const loading = ref(false)

onMounted(() => {
  if (Capacitor.isNativePlatform()) {
    document.body.classList.add('native-insets')
  }
})

const handleLogout = async () => {
  loading.value = true
  try {
    await authService.logout()
    if (Capacitor.isNativePlatform()) {
      await clearCredentials()
    }
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthGuard>
    <NativeNotificationBootstrap />
    <div id="app" :class="{ 'native-insets': isNativeApp }">
      <header class="app-header" :class="{ 'app-header-with-subtitle': isDailyRoute }">
        <h1 class="logo">FH5 Members</h1>
        <p v-if="isDailyRoute" class="app-header-subtitle">📅 Daily Dashboard</p>
      </header>

      <main class="app-main">
        <RouterView />
      </main>

      <nav class="bottom-nav" aria-label="Main navigation">
        <RouterLink to="/" class="nav-link">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Daily</span>
        </RouterLink>
        <RouterLink to="/dashboard" class="nav-link">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </RouterLink>
        <RouterLink to="/maps" class="nav-link">
          <span class="nav-icon">🗺️</span>
          <span class="nav-label">Maps</span>
        </RouterLink>
        <RouterLink to="/families" class="nav-link">
          <span class="nav-icon">👨‍👩‍👧‍👦</span>
          <span class="nav-label">Families</span>
        </RouterLink>
        <RouterLink to="/members" class="nav-link">
          <span class="nav-icon">👥</span>
          <span class="nav-label">Members</span>
        </RouterLink>
        <RouterLink to="/youth" class="nav-link">
          <span class="nav-icon">👨‍🦱</span>
          <span class="nav-label">Youth</span>
        </RouterLink>
        <RouterLink to="/import" class="nav-link">
          <span class="nav-icon">📥</span>
          <span class="nav-label">Import</span>
        </RouterLink>
        <button
          @click="handleLogout"
          class="logout-button"
          :disabled="loading"
        >
          <span class="nav-icon">🚪</span>
          <span class="nav-label">{{ loading ? '…' : 'Logout' }}</span>
        </button>
      </nav>
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
  padding-bottom: 0;
}

/* Native: no body padding – fixed header handles safe area */
body.native-insets {
  padding-top: 0;
  padding-bottom: 0;
}

/* Fixed top bar – always visible, full blue including under status bar */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 101;
  background: linear-gradient(135deg, #1a5f7a 0%, #2c7a9b 100%);
  box-shadow: 0 2px 8px rgba(26, 95, 122, 0.3);
  padding: max(24px, env(safe-area-inset-top, 24px)) 1rem 0.75rem 1rem;
  text-align: center;
}

.app-header .logo {
  margin: 0;
  font-size: 1.35rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.app-header-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: calc(3.5rem + max(24px, env(safe-area-inset-top, 24px)));
  padding-bottom: calc(72px + max(48px, env(safe-area-inset-bottom, 48px)));
}

/* More space when Daily subtitle is shown */
.app-header-with-subtitle + .app-main {
  padding-top: calc(4.75rem + max(24px, env(safe-area-inset-top, 24px)));
}

/* Fixed bottom nav – sits above Android system buttons */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.25rem;
  align-items: stretch;
  justify-content: flex-start;
  padding: 0.4rem 0.35rem 0.4rem 0.35rem;
  padding-bottom: max(48px, env(safe-area-inset-bottom, 48px));
  background: linear-gradient(135deg, #1a5f7a 0%, #2c7a9b 100%);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 56px;
}

.bottom-nav .nav-link,
.bottom-nav .logout-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.4rem 0.45rem;
  min-width: 48px;
  min-height: 48px;
  font-size: 0.65rem;
  flex-shrink: 0;
}

.bottom-nav .nav-icon {
  font-size: 1.35rem;
  line-height: 1;
}

.bottom-nav .nav-label {
  line-height: 1.1;
  white-space: nowrap;
}

.nav-link {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
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

.logout-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
  cursor: pointer;
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

@media (min-width: 769px) {
  .bottom-nav {
    justify-content: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    gap: 0.35rem;
  }
  .bottom-nav .nav-link,
  .bottom-nav .logout-button {
    min-width: 52px;
    min-height: 52px;
    font-size: 0.7rem;
  }
  .bottom-nav .nav-icon {
    font-size: 1.4rem;
  }
  .app-main {
    padding-bottom: calc(76px + max(48px, env(safe-area-inset-bottom, 48px)));
  }
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useMemberStore } from '@/stores/memberStore'
import {
  registerBirthdayAnniversaryNotificationActions,
  setupBirthdayAnniversaryActionListener,
  requestNotificationPermissionsAndSchedule,
} from '@/services/birthdayAnniversaryNotificationService'

let appStateListener: { remove: () => Promise<void> } | null = null

async function scheduleIfNeeded() {
  const memberStore = useMemberStore()
  if (memberStore.members.length === 0) await memberStore.fetchAllMembers()
  await requestNotificationPermissionsAndSchedule(memberStore.members)
}

/**
 * Runs only when the app is running as a native Capacitor app.
 * Registers notification actions and schedules daily birthday/anniversary
 * notifications after members are loaded. Reschedules when app returns to foreground.
 */
onMounted(async () => {
  if (!Capacitor.isNativePlatform()) return

  await registerBirthdayAnniversaryNotificationActions()
  await setupBirthdayAnniversaryActionListener()
  await scheduleIfNeeded()

  appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) scheduleIfNeeded()
  })
})

onUnmounted(async () => {
  if (appStateListener) await appStateListener.remove()
})
</script>

<template>
  <span v-if="false" />
</template>

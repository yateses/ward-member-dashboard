/**
 * Stores and retrieves login credentials on the native (Capacitor) app only.
 * Used so the phone can "remember" the user and auto sign-in after the first login.
 * Only runs when Capacitor.isNativePlatform() is true; no-op on web.
 */

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const KEY_EMAIL = 'auth_email'
const KEY_PASSWORD = 'auth_password'

export interface StoredCredentials {
  email: string
  password: string
}

export async function saveCredentials(email: string, password: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await Preferences.set({ key: KEY_EMAIL, value: email })
  await Preferences.set({ key: KEY_PASSWORD, value: password })
}

export async function getCredentials(): Promise<StoredCredentials | null> {
  if (!Capacitor.isNativePlatform()) return null
  const email = await Preferences.get({ key: KEY_EMAIL })
  const password = await Preferences.get({ key: KEY_PASSWORD })
  if (email.value && password.value) {
    return { email: email.value, password: password.value }
  }
  return null
}

export async function clearCredentials(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await Preferences.remove({ key: KEY_EMAIL })
  await Preferences.remove({ key: KEY_PASSWORD })
}

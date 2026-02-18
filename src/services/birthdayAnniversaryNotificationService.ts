/**
 * Birthday/Anniversary notification service for the Capacitor (native) app.
 * Schedules daily local notifications with "Ignore" and "Draft Text" actions.
 * Draft Text opens the default SMS app with a prefilled message.
 * Only runs when Capacitor.isNativePlatform() is true; no-op on web.
 */

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Member } from '@/types/member'

const ACTION_TYPE_ID = 'birthday_anniversary'
const ACTION_IGNORE = 'ignore'
const ACTION_DRAFT_TEXT = 'draft_text'
const NOTIFICATION_ID_BASE = 10000
const NOTIFICATION_ID_MAX = 19999
const CHANNEL_ID = 'birthdays-anniversaries'
const NOTIFICATION_HOUR = 8
const NOTIFICATION_MINUTE = 0

export interface NotificationPayload {
  type: 'birthday' | 'anniversary'
  phone: string
  message: string
  preferredName?: string
}

/**
 * Get first name for the message (e.g. "Jennifer" from "Wademan, Jennifer" or "John" from "John Smith").
 */
function getFirstName(preferredName: string): string {
  const trimmed = preferredName.trim()
  if (!trimmed) return trimmed
  if (trimmed.includes(',')) {
    const afterComma = trimmed.split(',')[1]?.trim()
    return afterComma || trimmed.split(/\s+/)[0] || trimmed
  }
  return trimmed.split(/\s+/)[0] || trimmed
}

function resolvePhoneForBirthday(member: Member, members: Member[]): string | null {
  if (member.age < 18) {
    const head = members.find(
      (m) => m.headOfHouse === member.headOfHouse && m.preferredName === member.headOfHouse
    )
    return head?.individualPhone?.trim() || null
  }
  return member.individualPhone?.trim() || null
}

function resolvePhoneForAnniversary(headOfHouse: string, members: Member[]): string | null {
  const head = members.find(
    (m) => m.headOfHouse === headOfHouse && m.preferredName === headOfHouse
  )
  if (head?.individualPhone) return head.individualPhone.trim()
  const anyInHouse = members.find((m) => m.headOfHouse === headOfHouse && m.individualPhone)
  return anyInHouse?.individualPhone?.trim() || null
}

function getTodaysBirthdays(members: Member[]): Member[] {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  return members.filter((member) => {
    if (!member.birthDate) return false
    const birthDate = new Date(member.birthDate)
    return birthDate.getDate() === todayDay && birthDate.getMonth() + 1 === todayMonth
  })
}

function getTodaysAnniversaries(members: Member[]): Array<{ headOfHouse: string; members: Member[] }> {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  const withAnniversary = members.filter((member) => {
    if (!member.marriageDate) return false
    const marriageDate = new Date(member.marriageDate)
    return marriageDate.getDate() === todayDay && marriageDate.getMonth() + 1 === todayMonth
  })
  const byHousehold = new Map<string, Member[]>()
  withAnniversary.forEach((member) => {
    const house = member.headOfHouse
    if (!byHousehold.has(house)) byHousehold.set(house, [])
    byHousehold.get(house)!.push(member)
  })
  const entries: Array<{ headOfHouse: string; members: Member[] }> = []
  byHousehold.forEach((members, headOfHouse) => {
    if (members.length > 0) entries.push({ headOfHouse, members })
  })
  return entries
}

export async function registerBirthdayAnniversaryNotificationActions(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: ACTION_TYPE_ID,
        actions: [
          { id: ACTION_IGNORE, title: 'Ignore' },
          { id: ACTION_DRAFT_TEXT, title: 'Draft Text' },
        ],
      },
    ],
  })
}

export async function setupBirthdayAnniversaryActionListener(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (event) => {
      if (event.actionId !== ACTION_DRAFT_TEXT) return
      const extra = event.notification.extra as NotificationPayload | undefined
      if (!extra?.phone || !extra?.message) return
      const phone = extra.phone.replace(/\D/g, '')
      const body = encodeURIComponent(extra.message)
      const url = `sms:${phone}?body=${body}`
      window.open(url, '_system')
    }
  )
}

async function ensureChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Birthdays & Anniversaries',
      importance: 4,
      description: 'Daily reminders for birthdays and anniversaries',
    })
  } catch {
    // Channel may already exist
  }
}

export async function scheduleBirthdayAnniversaryNotifications(members: Member[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (!members.length) return

  await ensureChannel()

  const toSchedule: Array<{ title: string; body: string; payload: NotificationPayload }> = []

  const birthdays = getTodaysBirthdays(members)
  for (const member of birthdays) {
    const phone = resolvePhoneForBirthday(member, members)
    if (!phone) continue
    const firstName = getFirstName(member.preferredName)
    const message = `Happy birthday ${firstName}! I hope you have a wonderful day!!!`
    toSchedule.push({
      title: 'Birthday',
      body: member.preferredName,
      payload: { type: 'birthday', phone, message, preferredName: member.preferredName },
    })
  }

  const anniversaries = getTodaysAnniversaries(members)
  for (const { headOfHouse } of anniversaries) {
    const phone = resolvePhoneForAnniversary(headOfHouse, members)
    if (!phone) continue
    const message = 'Happy anniversary to you two! I hope you guys have a wonderful day!!!'
    toSchedule.push({
      title: 'Anniversary',
      body: headOfHouse,
      payload: { type: 'anniversary', phone, message },
    })
  }

  const notificationsToCancel = Array.from(
    { length: NOTIFICATION_ID_MAX - NOTIFICATION_ID_BASE + 1 },
    (_, i) => ({ id: NOTIFICATION_ID_BASE + i })
  )
  await LocalNotifications.cancel({ notifications: notificationsToCancel })

  const now = new Date()
  let scheduleAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0)
  if (scheduleAt <= now) scheduleAt = new Date(now.getTime() + 60 * 1000)

  const notifications = toSchedule.map((item, index) => ({
    id: NOTIFICATION_ID_BASE + index,
    title: item.title,
    body: item.body,
    extra: item.payload,
    actionTypeId: ACTION_TYPE_ID,
    channelId: CHANNEL_ID,
    schedule: { at: scheduleAt },
  }))

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

export async function requestNotificationPermissionsAndSchedule(members: Member[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') {
      const { display: after } = await LocalNotifications.requestPermissions()
      if (after !== 'granted') return
    }
    await scheduleBirthdayAnniversaryNotifications(members)
  } catch (err) {
    console.warn('Birthday/anniversary notifications:', err)
  }
}

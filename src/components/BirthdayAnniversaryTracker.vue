<template>
  <div class="birthday-anniversary-tracker">
    <!-- Loading and Error States -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading completion data...</p>
    </div>
    
    <div v-if="loadError" class="error-state">
      <p>⚠️ {{ loadError }}</p>
      <button @click="loadCompletedEvents" class="retry-button">Retry</button>
    </div>

    <!-- Month Selector -->
    <div class="month-selector">
      <label for="month-select">View Month:</label>
      <select 
        id="month-select" 
        v-model="selectedMonth" 
        @change="onMonthChange"
        class="month-dropdown"
      >
        <option 
          v-for="month in availableMonths" 
          :key="month.value" 
          :value="month.value"
        >
          {{ month.label }}
        </option>
      </select>
    </div>

    <!-- Birthdays Section -->
    <div class="tracker-section">
      <h3>🎂 Birthdays {{ selectedMonthLabel }}</h3>
      <div v-if="birthdaysThisMonth.length === 0" class="empty-state">
        <p>No birthdays this month</p>
      </div>
      <div v-else class="event-list">
                 <div 
           v-for="birthday in birthdaysThisMonth" 
           :key="`birthday-${birthday.id}`"
           class="event-item"
           :class="{ 
             'completed': completedBirthdays.has(birthday.id!), 
             'today': birthday.isToday 
           }"
         >
          <label class="event-checkbox">
            <input 
              type="checkbox" 
              :checked="completedBirthdays.has(birthday.id!)"
              @change="toggleBirthday(birthday.id!)"
            />
            <span class="checkmark"></span>
          </label>
                     <div class="event-info">
             <div class="event-name">
               {{ birthday.preferredName }}
               <span v-if="birthday.isToday" class="today-star">⭐</span>
             </div>
             <div class="event-details">
               <span class="event-date">{{ formatBirthday(birthday) }}</span>
               <span class="event-age">{{ birthday.age }} years old</span>
               <span class="event-household">{{ birthday.headOfHouse }}</span>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Anniversaries Section -->
    <div class="tracker-section">
      <h3>💒 Anniversaries {{ selectedMonthLabel }}</h3>
      <div v-if="anniversariesThisMonth.length === 0" class="empty-state">
        <p>No anniversaries this month</p>
      </div>
             <div v-else class="event-list">
                   <div 
            v-for="anniversary in anniversariesThisMonth" 
            :key="`anniversary-${anniversary.id}`"
            class="event-item"
            :class="{ 
              'completed': completedAnniversaries.has(anniversary.id),
              'today': anniversary.isToday 
            }"
          >
           <label class="event-checkbox">
             <input 
               type="checkbox" 
               :checked="completedAnniversaries.has(anniversary.id)"
               @change="toggleAnniversary(anniversary.id)"
             />
             <span class="checkmark"></span>
           </label>
                       <div class="event-info">
              <div class="event-names">
                <span v-for="member in anniversary.members" :key="member.id" class="member-name">
                  {{ member.preferredName }}
                </span>
                <span v-if="anniversary.isToday" class="today-star">⭐</span>
              </div>
              <div class="event-details">
                <span class="event-date">{{ formatAnniversaryDate(anniversary.marriageDate) }}</span>
                <span class="event-years">{{ getAnniversaryYearsFromDate(anniversary.marriageDate) }} years</span>
                <span class="event-household">{{ anniversary.headOfHouse }}</span>
              </div>
            </div>
         </div>
       </div>
    </div>

    <!-- Summary -->
    <div class="tracker-summary">
      <div class="summary-item">
        <span class="summary-label">Birthdays:</span>
        <span class="summary-value">{{ completedBirthdays.size }}/{{ birthdaysThisMonth.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Anniversaries:</span>
        <span class="summary-value">{{ completedAnniversaries.size }}/{{ anniversariesThisMonth.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Next 30 Days:</span>
        <span class="summary-value">{{ upcomingEvents.length }}</span>
      </div>
    </div>

    <!-- Upcoming Events (Next 30 Days) -->
    <div v-if="upcomingEvents.length > 0" class="tracker-section">
      <h3>📅 Upcoming (Next 30 Days)</h3>
      <div class="event-list">
                 <div 
           v-for="event in upcomingEvents" 
           :key="`upcoming-${event.id}-${event.type}`"
           class="event-item"
           :class="{ 
             'upcoming': !event.isToday,
             'today': event.isToday 
           }"
         >
          <div class="event-icon">
            {{ event.type === 'birthday' ? '🎂' : '💒' }}
          </div>
                     <div class="event-info">
             <div v-if="event.type === 'birthday'" class="event-name">
               {{ event.member!.preferredName }}
               <span v-if="event.isToday" class="today-star">⭐</span>
             </div>
             <div v-else class="event-names">
               <span v-for="member in event.members" :key="member.id" class="member-name">
                 {{ member.preferredName }}
               </span>
               <span v-if="event.isToday" class="today-star">⭐</span>
             </div>
             <div class="event-details">
               <span class="event-date">{{ event.formattedDate }}</span>
               <span class="event-days">{{ event.daysUntil === 0 ? 'Today!' : `${event.daysUntil} days away` }}</span>
               <span class="event-household">{{ event.type === 'birthday' ? event.member!.headOfHouse : event.headOfHouse }}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { Member } from '../types/member'
import { birthdayAnniversaryService } from '../services/birthdayAnniversaryService'

interface Props {
  members: Member[]
}

const props = defineProps<Props>()

// Loading state
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// Month change handler
const onMonthChange = () => {
  loadCompletedEvents()
}

// Reactive state for completed events
const completedBirthdays = ref<Set<string>>(new Set())
const completedAnniversaries = ref<Set<string>>(new Set())

// Get current month and year
const currentDate = computed(() => new Date())
const currentMonth = computed(() => currentDate.value.getMonth() + 1) // 1-12
const currentYear = computed(() => currentDate.value.getFullYear())

// Month selector state
const selectedMonth = ref(`${currentYear.value}-${currentMonth.value.toString().padStart(2, '0')}`)

// Available months (current year and previous 2 years)
const availableMonths = computed(() => {
  const months = []
  const currentYear = new Date().getFullYear()
  
  // Add months from previous 2 years, current year, and next year
  for (let year = currentYear - 2; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0')
      const value = `${year}-${monthStr}`
      const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })
      const label = `${monthName} ${year}`
      
      months.push({ value, label })
    }
  }
  
  // Sort by date (newest first)
  return months.sort((a, b) => b.value.localeCompare(a.value))
})

// Selected month label for display
const selectedMonthLabel = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' })
  const isCurrentMonth = selectedMonth.value === `${currentYear.value}-${currentMonth.value.toString().padStart(2, '0')}`
  return isCurrentMonth ? 'This Month' : `in ${monthName} ${year}`
})

// Selected month and year for filtering
const selectedMonthNumber = computed(() => parseInt(selectedMonth.value.split('-')[1]))
const selectedYear = computed(() => parseInt(selectedMonth.value.split('-')[0]))

// Filter members with birthdays for selected month
const birthdaysThisMonth = computed(() => {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  const todayYear = today.getFullYear()
  
  return props.members.filter(member => {
    if (!member.birthDate) return false
    
    const birthDate = new Date(member.birthDate)
    return birthDate.getMonth() + 1 === selectedMonthNumber.value
  }).sort((a, b) => {
    const aDate = new Date(a.birthDate!)
    const bDate = new Date(b.birthDate!)
    return aDate.getDate() - bDate.getDate()
  }).map(member => {
    const birthDate = new Date(member.birthDate!)
    // Check if this birthday is today (regardless of year)
    const isToday = birthDate.getDate() === todayDay && 
                   birthDate.getMonth() + 1 === todayMonth && 
                   selectedYear.value === todayYear
    return { ...member, isToday }
  })
})

// Filter members with anniversaries for selected month and group couples
const anniversariesThisMonth = computed(() => {
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1
  const todayYear = today.getFullYear()
  
  const membersWithAnniversaries = props.members.filter(member => {
    if (!member.marriageDate) return false
    
    const marriageDate = new Date(member.marriageDate)
    return marriageDate.getMonth() + 1 === selectedMonthNumber.value
  })

  // Group by household to find couples
  const householdGroups = new Map<string, typeof membersWithAnniversaries>()
  
  membersWithAnniversaries.forEach(member => {
    const household = member.headOfHouse
    if (!householdGroups.has(household)) {
      householdGroups.set(household, [])
    }
    householdGroups.get(household)!.push(member)
  })

  // Create anniversary entries for each couple
  const anniversaryEntries: Array<{
    id: string
    members: typeof membersWithAnniversaries
    marriageDate: string
    headOfHouse: string
    isToday: boolean
  }> = []

  householdGroups.forEach((members, household) => {
    if (members.length > 0) {
      // Use the first member's marriage date (they should be the same for a couple)
      const firstMember = members[0]
      const marriageDate = new Date(firstMember.marriageDate!)
      const isToday = marriageDate.getDate() === todayDay && 
                     marriageDate.getMonth() + 1 === todayMonth && 
                     selectedYear.value === todayYear
      
      anniversaryEntries.push({
        id: `anniversary-${household}`,
        members,
        marriageDate: firstMember.marriageDate!,
        headOfHouse: household,
        isToday
      })
    }
  })

  // Sort by date
  return anniversaryEntries.sort((a, b) => {
    const aDate = new Date(a.marriageDate)
    const bDate = new Date(b.marriageDate)
    return aDate.getDate() - bDate.getDate()
  })
})

// Get upcoming events in the next 30 days
const upcomingEvents = computed(() => {
  const events: Array<{
    id: string
    type: 'birthday' | 'anniversary'
    member?: Member
    members?: Member[]
    date: Date
    daysUntil: number
    formattedDate: string
    headOfHouse?: string
    isToday: boolean
  }> = []
  
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  // Track processed anniversaries to avoid duplicates
  const processedAnniversaries = new Set<string>()
  
  props.members.forEach(member => {
    // Check birthdays
    if (member.birthDate) {
      const birthDate = new Date(member.birthDate)
      const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      
      // If birthday has passed this year, get next year's birthday
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1)
      }
      
             if (nextBirthday <= thirtyDaysFromNow && nextBirthday > today) {
         const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
         const isToday = daysUntil === 0
         events.push({
           id: member.id!,
           type: 'birthday',
           member,
           date: nextBirthday,
           daysUntil,
           formattedDate: nextBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
           isToday
         })
       }
    }
    
    // Check anniversaries (only process once per household)
    if (member.marriageDate && !processedAnniversaries.has(member.headOfHouse)) {
      const marriageDate = new Date(member.marriageDate)
      const nextAnniversary = new Date(today.getFullYear(), marriageDate.getMonth(), marriageDate.getDate())
      
      // If anniversary has passed this year, get next year's anniversary
      if (nextAnniversary < today) {
        nextAnniversary.setFullYear(today.getFullYear() + 1)
      }
      
             if (nextAnniversary <= thirtyDaysFromNow && nextAnniversary > today) {
         const daysUntil = Math.ceil((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
         const isToday = daysUntil === 0
         
         // Find all members in this household with the same marriage date
         const householdMembers = props.members.filter(m => 
           m.headOfHouse === member.headOfHouse && 
           m.marriageDate === member.marriageDate
         )
         
         events.push({
           id: `anniversary-${member.headOfHouse}`,
           type: 'anniversary',
           members: householdMembers,
           date: nextAnniversary,
           daysUntil,
           formattedDate: nextAnniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
           headOfHouse: member.headOfHouse,
           isToday
         })
         
         processedAnniversaries.add(member.headOfHouse)
       }
    }
  })
  
  return events.sort((a, b) => a.daysUntil - b.daysUntil)
})

// Format birthday for display
const formatBirthday = (member: Member) => {
  if (!member.birthDate) return ''
  const date = new Date(member.birthDate)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  })
}

// Format anniversary for display
const formatAnniversary = (member: Member) => {
  if (!member.marriageDate) return ''
  const date = new Date(member.marriageDate)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  })
}

// Format anniversary date from string
const formatAnniversaryDate = (marriageDate: string) => {
  const date = new Date(marriageDate)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  })
}

// Calculate anniversary years
const getAnniversaryYears = (member: Member) => {
  if (!member.marriageDate) return 0
  const marriageDate = new Date(member.marriageDate)
  const years = currentYear.value - marriageDate.getFullYear()
  return years
}

// Calculate anniversary years from date string
const getAnniversaryYearsFromDate = (marriageDate: string) => {
  const date = new Date(marriageDate)
  const years = currentYear.value - date.getFullYear()
  return years
}

// Toggle birthday completion
const toggleBirthday = async (memberId: string) => {
  if (completedBirthdays.value.has(memberId)) {
    completedBirthdays.value.delete(memberId)
  } else {
    completedBirthdays.value.add(memberId)
  }
  await saveCompletedBirthdays()
}

// Toggle anniversary completion
const toggleAnniversary = async (memberId: string) => {
  if (completedAnniversaries.value.has(memberId)) {
    completedAnniversaries.value.delete(memberId)
  } else {
    completedAnniversaries.value.add(memberId)
  }
  await saveCompletedAnniversaries()
}

// Save completed birthdays to Firestore
const saveCompletedBirthdays = async () => {
  try {
    await birthdayAnniversaryService.saveMonthCompletions(
      selectedMonth.value,
      Array.from(completedBirthdays.value),
      Array.from(completedAnniversaries.value)
    )
  } catch (error) {
    console.error('Error saving birthday completions:', error)
    loadError.value = 'Failed to save birthday completions'
  }
}

// Save completed anniversaries to Firestore
const saveCompletedAnniversaries = async () => {
  try {
    await birthdayAnniversaryService.saveMonthCompletions(
      selectedMonth.value,
      Array.from(completedBirthdays.value),
      Array.from(completedAnniversaries.value)
    )
  } catch (error) {
    console.error('Error saving anniversary completions:', error)
    loadError.value = 'Failed to save anniversary completions'
  }
}

// Load completed events from Firestore
const loadCompletedEvents = async () => {
  isLoading.value = true
  loadError.value = null
  
  try {
    const data = await birthdayAnniversaryService.loadMonthCompletions(selectedMonth.value)
    
    if (data) {
      completedBirthdays.value = new Set(data.birthdays)
      completedAnniversaries.value = new Set(data.anniversaries)
    } else {
      completedBirthdays.value = new Set()
      completedAnniversaries.value = new Set()
    }
  } catch (error) {
    console.error('Error loading completed events:', error)
    loadError.value = 'Failed to load completion data'
    // Fallback to empty sets
    completedBirthdays.value = new Set()
    completedAnniversaries.value = new Set()
  } finally {
    isLoading.value = false
  }
}

// Clear completed events for previous months (Firestore version)
const clearOldEvents = async () => {
  // Only clear old events if we're in a new month
  const currentMonthKey = `${currentYear.value}-${currentMonth.value.toString().padStart(2, '0')}`
  const lastClearedKey = `last-cleared-month-${currentYear.value}`
  const lastCleared = localStorage.getItem(lastClearedKey)
  
  // If we haven't cleared this month yet, and we're not in the same month as last cleared
  if (lastCleared !== currentMonthKey) {
    // Only clear if we're moving to a new month (not on initial load)
    if (lastCleared && lastCleared !== currentMonthKey) {
      console.log(`🔄 New month detected, clearing old completions`)
      
      // Clear the old month's completions from Firestore
      try {
        await birthdayAnniversaryService.deleteMonthCompletions(lastCleared)
        console.log(`🗑️ Cleared old month: ${lastCleared}`)
      } catch (error) {
        console.error('Error clearing old month completions:', error)
      }
    }
    
    // Update last cleared month to current month
    localStorage.setItem(lastClearedKey, currentMonthKey)
  }
}

onMounted(async () => {
  await clearOldEvents()
  await loadCompletedEvents()
})

// Watch for month changes and reload data
watch(selectedMonth, async () => {
  await loadCompletedEvents()
})
</script>

<style scoped>
.birthday-anniversary-tracker {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.month-selector label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.month-dropdown {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  min-width: 200px;
}

.month-dropdown:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #721c24;
}

.retry-button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.retry-button:hover {
  background: #c82333;
}

.tracker-section {
  margin-bottom: 1.5rem;
}

.tracker-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.event-item:hover {
  background: #e9ecef;
}

.event-item.completed {
  background: #d4edda;
  border-color: #28a745;
  opacity: 0.8;
}

.event-item.today {
  background: #fff3cd;
  border-color: #ffc107;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 10px rgba(255, 193, 7, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.6); }
  100% { box-shadow: 0 0 10px rgba(255, 193, 7, 0.3); }
}

.today-star {
  color: #ffc107;
  font-size: 1.1em;
  margin-left: 0.375rem;
  animation: twinkle 1.5s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.event-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.event-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s;
}

.event-checkbox:hover input ~ .checkmark {
  border-color: #3498db;
}

.event-checkbox input:checked ~ .checkmark {
  background-color: #28a745;
  border-color: #28a745;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.event-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.event-checkbox .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.event-info {
  flex: 1;
}

.event-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.125rem;
}

.event-names {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.member-name {
  font-weight: 600;
  color: #2c3e50;
  padding: 0.125rem 0.375rem;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 0.85rem;
}

.event-details {
  display: flex;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #7f8c8d;
  flex-wrap: wrap;
}

.event-date {
  font-weight: 500;
  color: #3498db;
}

.event-age {
  color: #e67e22;
}

.event-years {
  color: #e67e22;
}

.event-household {
  color: #9b59b6;
}

.event-icon {
  font-size: 1.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 6px;
}

.event-item.upcoming {
  background: #fff3cd;
  border-color: #ffc107;
}

.event-item.upcoming:hover {
  background: #ffeaa7;
}

.tracker-summary {
  display: flex;
  justify-content: space-around;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 0.75rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .birthday-anniversary-tracker {
    padding: 1rem;
  }
  
  .event-details {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .tracker-summary {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 
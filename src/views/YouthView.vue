<template>
  <div class="youth-view">
    <header class="youth-header">
      <h1>Youth Directory</h1>
      <p class="subtitle">Young Men and Young Women (Ages 12-18)</p>
    </header>

    <!-- Loading State -->
    <div v-if="memberStore.loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading youth data...</p>
    </div>

    <!-- Error Display -->
    <div v-if="memberStore.error" class="error-banner">
      <div class="error-content">
        <span>{{ memberStore.error }}</span>
        <button @click="memberStore.clearError()" class="error-close">×</button>
      </div>
    </div>

    <!-- Youth Statistics -->
    <div class="youth-stats">
      <div class="stat-card">
        <div class="stat-icon">👨‍🦱</div>
        <div class="stat-content">
          <h3>{{ youngMen.length }}</h3>
          <p>Young Men</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👩‍🦰</div>
        <div class="stat-content">
          <h3>{{ youngWomen.length }}</h3>
          <p>Young Women</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ allYouth.length }}</h3>
          <p>Total Youth</p>
        </div>
      </div>
    </div>

    <!-- Youth Sections -->
    <div class="youth-sections">
      <!-- Young Men Section -->
      <div class="youth-section">
        <h2>👨‍🦱 Young Men</h2>
        <div class="age-groups">
          <div v-for="ageGroup in youngMenByAge" :key="ageGroup.age" class="age-group">
            <h3>{{ ageGroup.age }} Year Olds ({{ ageGroup.members.length }})</h3>
            <div class="members-list">
              <div 
                v-for="member in ageGroup.members" 
                :key="member.id" 
                class="member-item"
              >
                <span class="member-name">{{ member.preferredName }}</span>
                <span class="member-age">{{ member.age }} years old</span>
                <span v-if="member.birthDate" class="member-birthday">
                  {{ formatBirthday(member.birthDate) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Young Women Section -->
      <div class="youth-section">
        <h2>👩‍🦰 Young Women</h2>
        <div class="age-groups">
          <div v-for="ageGroup in youngWomenByAge" :key="ageGroup.age" class="age-group">
            <h3>{{ ageGroup.age }} Year Olds ({{ ageGroup.members.length }})</h3>
            <div class="members-list">
              <div 
                v-for="member in ageGroup.members" 
                :key="member.id" 
                class="member-item"
              >
                <span class="member-name">{{ member.preferredName }}</span>
                <span class="member-age">{{ member.age }} years old</span>
                <span v-if="member.birthDate" class="member-birthday">
                  {{ formatBirthday(member.birthDate) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMemberStore } from '../stores/memberStore'
import type { Member } from '../types/member'

const memberStore = useMemberStore()

// Helper function to check if someone is youth (turns 12 in current year and younger than 19)
const isYouth = (member: Member): boolean => {
  if (!member.birthDate) return false
  
  const birthDate = new Date(member.birthDate)
  const today = new Date()
  const currentYear = today.getFullYear()
  
  // Calculate the year they turn 12
  const yearTurning12 = birthDate.getFullYear() + 12
  
  // Check if they turn 12 in the current year OR are already 12-18
  // This means they must be turning 12 this year (yearTurning12 === currentYear)
  // OR they are already 12-18 years old
  const ageThisYear = currentYear - birthDate.getFullYear()
  
  return (yearTurning12 === currentYear) || (ageThisYear >= 12 && ageThisYear < 19)
}

// Get all youth members
const allYouth = computed(() => {
  return memberStore.members.filter(isYouth)
})

// Get young men (males)
const youngMen = computed(() => {
  return allYouth.value.filter(member => member.gender === 'M')
})

// Get young women (females)
const youngWomen = computed(() => {
  return allYouth.value.filter(member => member.gender === 'F')
})

// Group young men by age
const youngMenByAge = computed(() => {
  const ageGroups: { [key: number]: Member[] } = {}
  
  youngMen.value.forEach(member => {
    const age = member.age || 0
    if (!ageGroups[age]) {
      ageGroups[age] = []
    }
    ageGroups[age].push(member)
  })
  
  return Object.keys(ageGroups)
    .map(age => ({
      age: parseInt(age),
      members: ageGroups[parseInt(age)].sort((a, b) => 
        a.preferredName.localeCompare(b.preferredName)
      )
    }))
    .sort((a, b) => b.age - a.age) // Sort oldest to youngest
})

// Group young women by age
const youngWomenByAge = computed(() => {
  const ageGroups: { [key: number]: Member[] } = {}
  
  youngWomen.value.forEach(member => {
    const age = member.age || 0
    if (!ageGroups[age]) {
      ageGroups[age] = []
    }
    ageGroups[age].push(member)
  })
  
  return Object.keys(ageGroups)
    .map(age => ({
      age: parseInt(age),
      members: ageGroups[parseInt(age)].sort((a, b) => 
        a.preferredName.localeCompare(b.preferredName)
      )
    }))
    .sort((a, b) => b.age - a.age) // Sort oldest to youngest
})

// Format birthday for display
const formatBirthday = (birthDate: string | Date): string => {
  const date = new Date(birthDate)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  })
}

onMounted(async () => {
  await memberStore.fetchAllMembers()
})
</script>

<style scoped>
.youth-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.youth-header {
  text-align: center;
  margin-bottom: 3rem;
}

.youth-header h1 {
  font-size: 2.5rem;
  color: #1a5f7a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1a5f7a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-banner {
  background-color: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.youth-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a5f7a 0%, #2c7a9b 100%);
  color: white;
  border-radius: 12px;
}

.stat-content h3 {
  font-size: 2rem;
  margin: 0;
  color: #2c3e50;
}

.stat-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.youth-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.youth-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.youth-section h2 {
  margin-top: 0;
  margin-bottom: 2rem;
  color: #1a5f7a;
  font-size: 1.8rem;
}

.age-groups {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.age-group h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: background 0.2s;
  border-left: 3px solid #1a5f7a;
}

.member-item:hover {
  background: #e9ecef;
}

.member-name {
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
  min-width: 0;
}

.member-age {
  font-weight: 500;
  color: #1a5f7a;
  font-size: 0.9rem;
  white-space: nowrap;
}

.member-birthday {
  font-size: 0.8rem;
  color: #95a5a6;
  white-space: nowrap;
}

/* Mobile and Tablet Responsive Design */
@media (max-width: 1024px) {
  .youth-view {
    padding: 1.5rem;
  }
  
  .youth-header h1 {
    font-size: 2rem;
  }
  
  .youth-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1.25rem;
  }
  
  .youth-sections {
    gap: 1.5rem;
  }
  
  .youth-section {
    padding: 1.5rem;
  }
  
  .youth-section h2 {
    font-size: 1.6rem;
  }
}

@media (max-width: 768px) {
  .youth-view {
    padding: 1rem;
  }
  
  .youth-header {
    margin-bottom: 2rem;
  }
  
  .youth-header h1 {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .youth-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-content h3 {
    font-size: 1.5rem;
  }
  
  .stat-content p {
    font-size: 0.85rem;
  }
  
  .youth-sections {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .youth-section {
    padding: 1rem;
  }
  
  .youth-section h2 {
    font-size: 1.4rem;
    margin-bottom: 1.5rem;
  }
  
  .age-groups {
    gap: 1.25rem;
  }
  
  .age-group h3 {
    font-size: 1.1rem;
    margin-bottom: 0.6rem;
  }
  
  .members-list {
    gap: 0.4rem;
  }
  
  .member-item {
    padding: 0.6rem;
    gap: 0.75rem;
  }
  
  .member-name {
    font-size: 0.9rem;
  }
  
  .member-age {
    font-size: 0.85rem;
  }
  
  .member-birthday {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .youth-view {
    padding: 0.75rem;
  }
  
  .youth-header {
    margin-bottom: 1.5rem;
  }
  
  .youth-header h1 {
    font-size: 1.5rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .youth-stats {
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-content h3 {
    font-size: 1.3rem;
  }
  
  .stat-content p {
    font-size: 0.8rem;
  }
  
  .youth-sections {
    gap: 1rem;
  }
  
  .youth-section {
    padding: 0.75rem;
  }
  
  .youth-section h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  
  .age-groups {
    gap: 1rem;
  }
  
  .age-group h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .members-list {
    gap: 0.3rem;
  }
  
  .member-item {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .member-name {
    font-size: 0.85rem;
  }
  
  .member-age {
    font-size: 0.8rem;
  }
  
  .member-birthday {
    font-size: 0.7rem;
  }
}
</style> 
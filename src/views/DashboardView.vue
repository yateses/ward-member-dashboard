<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>FH5 Members</h1>
      <p class="subtitle">Organize and manage your congregation data</p>
    </header>

    <!-- Error Display -->
    <div v-if="memberStore.error" class="error-banner">
      <div class="error-content">
        <span>{{ memberStore.error }}</span>
        <button @click="memberStore.clearError()" class="error-close">×</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="memberStore.loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading congregation data...</p>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ memberStore.totalMembers }}</h3>
          <p>Total Members</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🏠</div>
        <div class="stat-content">
          <h3>{{ memberStore.totalHouseholds }}</h3>
          <p>Households</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <h3>{{ memberStore.membersWithCallings.length }}</h3>
          <p>Members with Callings</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👶</div>
        <div class="stat-content">
          <h3>{{ memberStore.membersByAge.children.length }}</h3>
          <p>Children (0-17)</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎂</div>
        <div class="stat-content">
          <h3>{{ birthdaysThisMonth.length }}</h3>
          <p>Birthdays This Month</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💒</div>
        <div class="stat-content">
          <h3>{{ anniversariesThisMonth.length }}</h3>
          <p>Anniversaries This Month</p>
        </div>
      </div>
    </div>

    <!-- Temple Recommend Expirations -->
    <div class="recommend-section">
      <h2>🏛️ Temple Recommends Expiring This Month</h2>
      <div v-if="expiringRecommends.length === 0" class="no-expirations">
        <p>No temple recommends are expiring this month.</p>
      </div>
      <div v-else class="expiring-members">
        <div 
          v-for="member in expiringRecommends" 
          :key="member.id" 
          class="member-card"
        >
          <div class="member-avatar">
            {{ member.preferredName.charAt(0) }}
          </div>
          <div class="member-info">
            <h4>{{ member.preferredName }}</h4>
            <p>{{ member.headOfHouse }}</p>
            <p class="expiration-date">
              Expires: {{ formatExpirationDate(member.templeRecommendExpirationDate!) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- To-Do Items by Category -->
    <div class="todo-section">
      <TodoItemsByCategory />
    </div>

    <!-- Age Distribution Chart -->
    <div class="chart-section">
      <h2>Age Distribution</h2>
      <div class="age-chart">
        <div class="age-bar">
          <div class="age-label">Children (0-17)</div>
          <div class="age-bar-container">
            <div 
              class="age-bar-fill children" 
              :style="{ width: `${childrenPercentage}%` }"
            ></div>
          </div>
          <div class="age-count">{{ memberStore.membersByAge.children.length }}</div>
        </div>
        
        <div class="age-bar">
          <div class="age-label">Youth (18-29)</div>
          <div class="age-bar-container">
            <div 
              class="age-bar-fill youth" 
              :style="{ width: `${youthPercentage}%` }"
            ></div>
          </div>
          <div class="age-count">{{ memberStore.membersByAge.youth.length }}</div>
        </div>
        
        <div class="age-bar">
          <div class="age-label">Adults (30+)</div>
          <div class="age-bar-container">
            <div 
              class="age-bar-fill adults" 
              :style="{ width: `${adultsPercentage}%` }"
            ></div>
          </div>
          <div class="age-count">{{ memberStore.membersByAge.adults.length }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions-section">
      <h2>Quick Actions</h2>
      <div class="action-buttons">
        <router-link to="/import" class="action-btn primary">
          <span class="btn-icon">📥</span>
          <span>Import LCR Data</span>
        </router-link>
        
        <router-link to="/members" class="action-btn">
          <span class="btn-icon">👥</span>
          <span>View All Members</span>
        </router-link>
        
        <router-link to="/households" class="action-btn">
          <span class="btn-icon">🏠</span>
          <span>View Households</span>
        </router-link>
        
        <router-link to="/callings" class="action-btn">
          <span class="btn-icon">📋</span>
          <span>Callings Report</span>
        </router-link>
      </div>
    </div>

    <!-- Birthday & Anniversary Tracker -->
    <div class="tracker-section">
      <h2>🎉 This Month's Celebrations</h2>
      <BirthdayAnniversaryTracker :members="memberStore.members" />
    </div>

    <!-- Recent Activity -->
    <div class="recent-section">
      <h2>Recent Members</h2>
      <div class="recent-members">
        <div 
          v-for="member in recentMembers" 
          :key="member.id" 
          class="member-card"
        >
          <div class="member-avatar">
            {{ member.preferredName.charAt(0) }}
          </div>
          <div class="member-info">
            <h4>{{ member.preferredName }}</h4>
            <p>{{ member.headOfHouse }}</p>
            <p class="member-age">{{ member.age }} years old</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useMemberStore } from '../stores/memberStore'
import BirthdayAnniversaryTracker from '../components/BirthdayAnniversaryTracker.vue'
import TodoItemsByCategory from '../components/TodoItemsByCategory.vue'

const memberStore = useMemberStore()

// Computed properties for percentages
const childrenPercentage = computed(() => {
  if (memberStore.totalMembers === 0) return 0
  return Math.round((memberStore.membersByAge.children.length / memberStore.totalMembers) * 100)
})

const youthPercentage = computed(() => {
  if (memberStore.totalMembers === 0) return 0
  return Math.round((memberStore.membersByAge.youth.length / memberStore.totalMembers) * 100)
})

const adultsPercentage = computed(() => {
  if (memberStore.totalMembers === 0) return 0
  return Math.round((memberStore.membersByAge.adults.length / memberStore.totalMembers) * 100)
})

// Get recent members (last 5 added)
const recentMembers = computed(() => {
  return memberStore.members
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return bTime - aTime
    })
    .slice(0, 5)
})

// Get birthdays and anniversaries for this month
const currentMonth = computed(() => new Date().getMonth() + 1)

const birthdaysThisMonth = computed(() => {
  return memberStore.members.filter(member => {
    if (!member.birthDate) return false
    const birthDate = new Date(member.birthDate)
    return birthDate.getMonth() + 1 === currentMonth.value
  })
})

const anniversariesThisMonth = computed(() => {
  return memberStore.members.filter(member => {
    if (!member.marriageDate) return false
    const marriageDate = new Date(member.marriageDate)
    return marriageDate.getMonth() + 1 === currentMonth.value
  })
})

// Get temple recommends expiring this month
const expiringRecommends = computed(() => {
  return memberStore.members.filter(member => {
    if (!member.templeRecommendExpirationDate) return false
    const expirationDate = new Date(member.templeRecommendExpirationDate)
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    
    return expirationDate.getFullYear() === currentYear && 
           expirationDate.getMonth() + 1 === currentMonth
  }).sort((a, b) => {
    const aDate = new Date(a.templeRecommendExpirationDate!)
    const bDate = new Date(b.templeRecommendExpirationDate!)
    return aDate.getTime() - bDate.getTime() // Sort by expiration date (earliest first)
  })
})

// Format expiration date for display
const formatExpirationDate = (expirationDate: string | Date): string => {
  const date = new Date(expirationDate)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

onMounted(async () => {
  await memberStore.fetchAllMembers()
  await memberStore.fetchAllHouseholds()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #1a5f7a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.chart-section, .actions-section, .recent-section, .tracker-section, .recommend-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.chart-section h2, .actions-section h2, .recent-section h2, .tracker-section h2, .recommend-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #1a5f7a;
}

.age-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.age-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.age-label {
  min-width: 120px;
  font-weight: 500;
}

.age-bar-container {
  flex: 1;
  height: 20px;
  background: #f1f2f6;
  border-radius: 10px;
  overflow: hidden;
}

.age-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.age-bar-fill.children {
  background: #74b9ff;
}

.age-bar-fill.youth {
  background: #fd79a8;
}

.age-bar-fill.adults {
  background: #55a3ff;
}

.age-count {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.action-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #1a5f7a 0%, #2c7a9b 100%);
  color: white;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #134b5f 0%, #1a5f7a 100%);
}

.btn-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.recent-members {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background 0.2s;
}

.member-card:hover {
  background: #e9ecef;
}

.member-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #1a5f7a 0%, #2c7a9b 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.member-info h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.member-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.member-age {
  font-weight: 500;
  color: #1a5f7a !important;
}

/* Temple Recommend Section Styles */
.no-expirations {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

.expiring-members {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.expiration-date {
  font-weight: 500;
  color: #e74c3c !important;
}

.todo-section {
  margin: 2rem 0;
}

/* Mobile and Tablet Responsive Design */
@media (max-width: 1024px) {
  .dashboard {
    padding: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-content h3 {
    font-size: 1.5rem;
  }
  
  .chart-section, .actions-section, .recent-section, .tracker-section, .recommend-section {
    padding: 1.5rem;
  }
  
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .recent-members, .expiring-members {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.8rem;
  }
  
  .dashboard-header .subtitle {
    font-size: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
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
  
  .chart-section, .actions-section, .recent-section, .tracker-section, .recommend-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .chart-section h2, .actions-section h2, .recent-section h2, .tracker-section h2, .recommend-section h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .action-btn {
    padding: 1rem;
  }
  
  .btn-icon {
    font-size: 1.5rem;
  }
  
  .recent-members, .expiring-members {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .member-card {
    padding: 0.75rem;
  }
  
  .member-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .age-bar {
    gap: 0.5rem;
  }
  
  .age-label {
    min-width: 80px;
    font-size: 0.9rem;
  }
  
  .age-count {
    min-width: 30px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0.75rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  .dashboard-header .subtitle {
    font-size: 0.9rem;
  }
  
  .stats-grid {
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 0.5rem;
  }
  
  .stat-content h3 {
    font-size: 1.1rem;
  }
  
  .stat-content p {
    font-size: 0.75rem;
  }
  
  .chart-section, .actions-section, .recent-section, .tracker-section, .recommend-section {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .chart-section h2, .actions-section h2, .recent-section h2, .tracker-section h2, .recommend-section h2 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }
  
  .action-btn {
    padding: 0.75rem;
  }
  
  .btn-icon {
    font-size: 1.2rem;
  }
  
  .member-card {
    padding: 0.5rem;
  }
  
  .member-avatar {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
  
  .member-info h4 {
    font-size: 0.9rem;
  }
  
  .member-info p {
    font-size: 0.8rem;
  }
  
  .age-label {
    min-width: 60px;
    font-size: 0.8rem;
  }
  
  .age-count {
    min-width: 25px;
    font-size: 0.8rem;
  }
}
</style> 
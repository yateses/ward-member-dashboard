<template>
  <div class="households-view">
    <header class="page-header">
      <h1>Households</h1>
      <div class="header-actions">
        <router-link to="/import" class="btn btn-primary">
          📥 Import New Data
        </router-link>
      </div>
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
      <p>Loading households...</p>
    </div>

    <!-- Households List -->
    <div v-if="!memberStore.loading" class="households-container">
      <div class="households-stats">
        <div class="stat-item">
          <span class="stat-label">Total Households:</span>
          <span class="stat-value">{{ memberStore.totalHouseholds }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Members:</span>
          <span class="stat-value">{{ memberStore.totalMembers }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average Household Size:</span>
          <span class="stat-value">{{ averageHouseholdSize }}</span>
        </div>
      </div>

      <div class="households-grid">
        <div
          v-for="household in memberStore.households"
          :key="household.headOfHouse"
          class="household-card"
          @click="viewHousehold(household)"
        >
          <div class="household-header">
            <div class="household-avatar">
              {{ household.headOfHouse.charAt(0) }}
            </div>
            <div class="household-info">
              <h3 class="household-name">{{ household.headOfHouse }}</h3>
              <p class="household-address">{{ household.address }}</p>
              <p class="household-size">{{ household.members.length }} member{{ household.members.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          
          <div class="household-members">
            <div
              v-for="member in household.members.slice(0, 3)"
              :key="member.id"
              class="member-item"
            >
              <div class="member-avatar-small">
                {{ member.preferredName.charAt(0) }}
              </div>
              <div class="member-details">
                <span class="member-name">{{ member.preferredName }}</span>
                <span class="member-age">{{ member.age }} years old</span>
              </div>
            </div>
            <div v-if="household.members.length > 3" class="more-members">
              +{{ household.members.length - 3 }} more members
            </div>
          </div>

          <div class="household-callings" v-if="householdCallings(household).length">
            <h4>Callings in this household:</h4>
            <div class="callings-list">
              <span 
                v-for="calling in householdCallings(household).slice(0, 3)" 
                :key="calling"
                class="calling-badge"
              >
                {{ calling }}
              </span>
              <span 
                v-if="householdCallings(household).length > 3" 
                class="calling-more"
              >
                +{{ householdCallings(household).length - 3 }} more
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!memberStore.loading && memberStore.households.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h2>No Households Found</h2>
        <p>Get started by importing your congregation data.</p>
        <router-link to="/import" class="btn btn-primary">
          Import Data
        </router-link>
      </div>
    </div>

    <!-- Household Detail Modal -->
    <div v-if="selectedHousehold" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedHousehold.headOfHouse }} Household</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="household-detail-info">
            <div class="detail-item">
              <label>Address:</label>
              <span>{{ selectedHousehold.address }}</span>
            </div>
            <div class="detail-item">
              <label>Total Members:</label>
              <span>{{ selectedHousehold.members.length }}</span>
            </div>
          </div>

          <div class="members-section">
            <h3>Household Members</h3>
            <div class="members-list">
              <div
                v-for="member in selectedHousehold.members"
                :key="member.id"
                class="member-detail-item"
              >
                <div class="member-avatar">
                  {{ member.preferredName.charAt(0) }}
                </div>
                <div class="member-info">
                  <h4>{{ member.preferredName }}</h4>
                  <p>{{ member.age }} years old • {{ member.gender === 'M' ? 'Male' : 'Female' }}</p>
                  <p v-if="member.individualPhone">📞 {{ member.individualPhone }}</p>
                  <p v-if="member.individualEmail">📧 {{ member.individualEmail }}</p>
                  <div v-if="member.callings && member.callings.length" class="member-callings">
                    <span 
                      v-for="calling in member.callings" 
                      :key="calling"
                      class="calling-badge"
                    >
                      {{ calling }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from '../stores/memberStore'
import type { Household } from '../types/member'

const memberStore = useMemberStore()

// Reactive data
const selectedHousehold = ref<Household | null>(null)

// Computed properties
const averageHouseholdSize = computed(() => {
  if (memberStore.totalHouseholds === 0) return 0
  return (memberStore.totalMembers / memberStore.totalHouseholds).toFixed(1)
})

// Methods
const householdCallings = (household: Household) => {
  const allCallings: string[] = []
  household.members.forEach(member => {
    if (member.callings) {
      allCallings.push(...member.callings)
    }
  })
  return allCallings
}

const viewHousehold = (household: Household) => {
  selectedHousehold.value = household
}

const closeModal = () => {
  selectedHousehold.value = null
}

onMounted(async () => {
  await memberStore.fetchAllHouseholds()
})
</script>

<style scoped>
.households-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
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
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.households-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #3498db;
}

.households-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.household-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.household-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.household-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.household-avatar {
  width: 60px;
  height: 60px;
  background: #e67e22;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
}

.household-name {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.household-address {
  color: #7f8c8d;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
}

.household-size {
  color: #3498db;
  font-weight: 500;
  margin: 0;
  font-size: 0.9rem;
}

.household-members {
  margin-bottom: 1.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f2f6;
}

.member-item:last-child {
  border-bottom: none;
}

.member-avatar-small {
  width: 35px;
  height: 35px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.member-age {
  color: #7f8c8d;
  font-size: 0.8rem;
}

.more-members {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-style: italic;
  padding: 0.5rem 0;
}

.household-callings h4 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.callings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.calling-badge {
  background: #e8f4fd;
  color: #3498db;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.calling-more {
  color: #7f8c8d;
  font-size: 0.8rem;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
}

.household-detail-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.detail-item span {
  color: #7f8c8d;
}

.members-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-detail-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.member-avatar {
  width: 50px;
  height: 50px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.member-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.member-info p {
  margin: 0 0 0.25rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.member-callings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .households-view {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .households-grid {
    grid-template-columns: 1fr;
  }
  
  .households-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .household-detail-info {
    grid-template-columns: 1fr;
  }
}
</style> 
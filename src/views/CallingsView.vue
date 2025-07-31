<template>
  <div class="callings-view">
    <header class="page-header">
      <h1>Callings Report</h1>
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
      <p>Loading callings data...</p>
    </div>

    <!-- Callings Overview -->
    <div v-if="!memberStore.loading" class="callings-container">
      <div class="callings-stats">
        <div class="stat-item">
          <span class="stat-label">Members with Callings:</span>
          <span class="stat-value">{{ memberStore.membersWithCallings.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Callings:</span>
          <span class="stat-value">{{ totalCallings }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Unique Callings:</span>
          <span class="stat-value">{{ uniqueCallings.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Members without Callings:</span>
          <span class="stat-value">{{ membersWithoutCallings }}</span>
        </div>
      </div>

      <!-- Callings by Category -->
      <div class="callings-sections">
        <!-- Unique Callings List -->
        <div class="callings-section">
          <h2>All Callings</h2>
          <div class="callings-grid">
            <div
              v-for="calling in uniqueCallings"
              :key="calling"
              class="calling-card"
              @click="viewCallingMembers(calling)"
            >
              <div class="calling-header">
                <h3>{{ calling }}</h3>
                <span class="member-count">{{ getCallingMembers(calling).length }} member{{ getCallingMembers(calling).length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="calling-members">
                <div
                  v-for="member in getCallingMembers(calling).slice(0, 3)"
                  :key="member.id"
                  class="member-item"
                >
                  <div class="member-avatar-small">
                    {{ member.preferredName.charAt(0) }}
                  </div>
                  <span class="member-name">{{ member.preferredName }}</span>
                </div>
                <div v-if="getCallingMembers(calling).length > 3" class="more-members">
                  +{{ getCallingMembers(calling).length - 3 }} more
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Members with Multiple Callings -->
        <div class="callings-section">
          <h2>Members with Multiple Callings</h2>
          <div class="multiple-callings-list">
            <div
              v-for="member in membersWithMultipleCallings"
              :key="member.id"
              class="member-card"
            >
              <div class="member-header">
                <div class="member-avatar">
                  {{ member.preferredName.charAt(0) }}
                </div>
                <div class="member-info">
                  <h3>{{ member.preferredName }}</h3>
                  <p>{{ member.headOfHouse }}</p>
                </div>
              </div>
              <div class="member-callings">
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

        <!-- Members without Callings -->
        <div class="callings-section">
          <h2>Members without Callings</h2>
          <div class="no-callings-list">
            <div
              v-for="member in membersWithoutCallingsList"
              :key="member.id"
              class="member-item"
            >
              <div class="member-avatar-small">
                {{ member.preferredName.charAt(0) }}
              </div>
              <div class="member-details">
                <span class="member-name">{{ member.preferredName }}</span>
                <span class="member-household">{{ member.headOfHouse }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!memberStore.loading && memberStore.members.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>No Callings Data Found</h2>
        <p>Get started by importing your congregation data.</p>
        <router-link to="/import" class="btn btn-primary">
          Import Data
        </router-link>
      </div>
    </div>

    <!-- Calling Detail Modal -->
    <div v-if="selectedCalling" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedCalling }}</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="calling-stats">
            <div class="stat-item">
              <span class="stat-label">Total Members:</span>
              <span class="stat-value">{{ getCallingMembers(selectedCalling).length }}</span>
            </div>
          </div>

          <div class="members-section">
            <h3>Members with this Calling</h3>
            <div class="members-list">
              <div
                v-for="member in getCallingMembers(selectedCalling)"
                :key="member.id"
                class="member-detail-item"
              >
                <div class="member-avatar">
                  {{ member.preferredName.charAt(0) }}
                </div>
                <div class="member-info">
                  <h4>{{ member.preferredName }}</h4>
                  <p>{{ member.headOfHouse }}</p>
                  <p>{{ member.age }} years old • {{ member.gender === 'M' ? 'Male' : 'Female' }}</p>
                  <p v-if="member.individualPhone">📞 {{ member.individualPhone }}</p>
                  <p v-if="member.individualEmail">📧 {{ member.individualEmail }}</p>
                  <div v-if="member.callings && member.callings.length > 1" class="all-callings">
                    <span class="calling-label">All callings:</span>
                    <div class="callings-list">
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
import type { Member } from '../types/member'

const memberStore = useMemberStore()

// Reactive data
const selectedCalling = ref<string | null>(null)

// Computed properties
const totalCallings = computed(() => {
  return memberStore.membersWithCallings.reduce((total, member) => {
    return total + (member.callings?.length || 0)
  }, 0)
})

const uniqueCallings = computed(() => {
  const callings = new Set<string>()
  memberStore.membersWithCallings.forEach(member => {
    if (member.callings) {
      member.callings.forEach(calling => callings.add(calling))
    }
  })
  return Array.from(callings).sort()
})

const membersWithoutCallings = computed(() => {
  return memberStore.totalMembers - memberStore.membersWithCallings.length
})

const membersWithoutCallingsList = computed(() => {
  return memberStore.members.filter(member => 
    !member.callings || member.callings.length === 0
  )
})

const membersWithMultipleCallings = computed(() => {
  return memberStore.membersWithCallings.filter(member => 
    member.callings && member.callings.length > 1
  )
})

// Methods
const getCallingMembers = (calling: string) => {
  return memberStore.members.filter(member => 
    member.callings && member.callings.includes(calling)
  )
}

const viewCallingMembers = (calling: string) => {
  selectedCalling.value = calling
}

const closeModal = () => {
  selectedCalling.value = null
}

onMounted(async () => {
  await memberStore.fetchAllMembers()
})
</script>

<style scoped>
.callings-view {
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

.callings-stats {
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

.callings-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.callings-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.callings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.calling-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.calling-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.calling-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.calling-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.member-count {
  background: #e8f4fd;
  color: #3498db;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.calling-members {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  width: 30px;
  height: 30px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.member-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.more-members {
  color: #7f8c8d;
  font-size: 0.8rem;
  font-style: italic;
  padding: 0.5rem 0;
}

.multiple-callings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.member-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.member-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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
}

.member-info h3 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.member-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.member-callings {
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

.no-callings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-household {
  color: #7f8c8d;
  font-size: 0.8rem;
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

.calling-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
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

.member-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.member-info p {
  margin: 0 0 0.25rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.all-callings {
  margin-top: 0.5rem;
}

.calling-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.callings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
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
  .callings-view {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .callings-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .callings-grid {
    grid-template-columns: 1fr;
  }
  
  .multiple-callings-list {
    grid-template-columns: 1fr;
  }
  
  .no-callings-list {
    grid-template-columns: 1fr;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .calling-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 
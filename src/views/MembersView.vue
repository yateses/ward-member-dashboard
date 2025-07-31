<template>
  <div class="members-view">
    <header class="page-header">
      <h1>Members</h1>
      <div class="header-actions">
        <div class="search-box">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search members..."
            class="search-input"
          />
          <button @click="performSearch" class="search-btn">🔍</button>
        </div>
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
      <p>Loading members...</p>
    </div>

    <!-- Members List -->
    <div v-if="!memberStore.loading" class="members-container">
      <div class="members-stats">
        <div class="stat-item">
          <span class="stat-label">Total Members:</span>
          <span class="stat-value">{{ memberStore.totalMembers }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Showing:</span>
          <span class="stat-value">{{ displayedMembers.length }}</span>
        </div>
      </div>

      <div class="members-grid">
        <div
          v-for="member in displayedMembers"
          :key="member.id"
          class="member-card"
          @click="viewMember(member)"
        >
          <div class="member-avatar">
            {{ member.preferredName.charAt(0) }}
          </div>
          <div class="member-info">
            <h3 class="member-name">{{ member.preferredName }}</h3>
            <p class="member-household">{{ member.headOfHouse }}</p>
            <p class="member-details">
              <span class="member-age">{{ member.age }} years old</span>
              <span class="member-gender">{{ member.gender === 'M' ? 'Male' : 'Female' }}</span>
            </p>
            <p class="member-address">{{ member.addressStreet1 }}</p>
            <div v-if="member.callings && member.callings.length" class="member-callings">
              <span class="calling-badge" v-for="calling in member.callings.slice(0, 2)" :key="calling">
                {{ calling }}
              </span>
              <span v-if="member.callings.length > 2" class="calling-more">
                +{{ member.callings.length - 2 }} more
              </span>
            </div>
          </div>
          <div class="member-actions">
            <button @click.stop="editMember(member)" class="action-btn">✏️</button>
            <button @click.stop="deleteMember(member)" class="action-btn delete">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!memberStore.loading && displayedMembers.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h2>No Members Found</h2>
        <p v-if="searchTerm">No members match your search criteria.</p>
        <p v-else>Get started by importing your congregation data.</p>
        <router-link to="/import" class="btn btn-primary">
          Import Data
        </router-link>
      </div>
    </div>

    <!-- Member Detail Modal -->
    <div v-if="selectedMember" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedMember.preferredName }}</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="member-detail-grid">
            <div class="detail-item">
              <label>Head of Household:</label>
              <span>{{ selectedMember.headOfHouse }}</span>
            </div>
            <div class="detail-item">
              <label>Age:</label>
              <span>{{ selectedMember.age }} years old</span>
            </div>
            <div class="detail-item">
              <label>Gender:</label>
              <span>{{ selectedMember.gender === 'M' ? 'Male' : 'Female' }}</span>
            </div>
            <div class="detail-item">
              <label>Address:</label>
              <span>{{ selectedMember.addressStreet1 }}</span>
            </div>
            <div class="detail-item" v-if="selectedMember.individualPhone">
              <label>Phone:</label>
              <span>{{ selectedMember.individualPhone }}</span>
            </div>
            <div class="detail-item" v-if="selectedMember.individualEmail">
              <label>Email:</label>
              <span>{{ selectedMember.individualEmail }}</span>
            </div>
            <div class="detail-item" v-if="selectedMember.baptismDate">
              <label>Baptism Date:</label>
              <span>{{ selectedMember.baptismDate }}</span>
            </div>
            <div class="detail-item" v-if="selectedMember.priesthoodOffice">
              <label>Priesthood Office:</label>
              <span>{{ selectedMember.priesthoodOffice }}</span>
            </div>
            <div class="detail-item" v-if="selectedMember.callings && selectedMember.callings.length">
              <label>Callings:</label>
              <div class="callings-list">
                <span v-for="calling in selectedMember.callings" :key="calling" class="calling-item">
                  {{ calling }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="editMember(selectedMember)" class="btn btn-primary">
            Edit Member
          </button>
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
const searchTerm = ref('')
const selectedMember = ref<Member | null>(null)
const searchResults = ref<Member[]>([])

// Computed properties
const displayedMembers = computed(() => {
  let members = []
  if (searchTerm.value && searchResults.value.length > 0) {
    members = searchResults.value
  } else {
    members = memberStore.members
  }
  
  // Sort members alphabetically by preferredName
  return members.sort((a, b) => {
    const nameA = a.preferredName?.toLowerCase() || ''
    const nameB = b.preferredName?.toLowerCase() || ''
    return nameA.localeCompare(nameB)
  })
})

// Methods
const performSearch = async () => {
  if (searchTerm.value.trim()) {
    searchResults.value = await memberStore.searchMembers(searchTerm.value)
  } else {
    searchResults.value = []
  }
}

const viewMember = (member: Member) => {
  selectedMember.value = member
}

const editMember = (member: Member) => {
  // TODO: Implement edit functionality
  console.log('Edit member:', member)
}

const deleteMember = async (member: Member) => {
  if (confirm(`Are you sure you want to delete ${member.preferredName}?`)) {
    try {
      await memberStore.deleteMember(member.id!)
    } catch (error) {
      console.error('Failed to delete member:', error)
    }
  }
}

const closeModal = () => {
  selectedMember.value = null
}

onMounted(async () => {
  await memberStore.fetchAllMembers()
})
</script>

<style scoped>
.members-view {
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
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input {
  padding: 0.75rem 1rem;
  border: none;
  outline: none;
  min-width: 250px;
}

.search-btn {
  padding: 0.75rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
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

.members-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.member-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.member-avatar {
  width: 60px;
  height: 60px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.member-name {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.member-household {
  color: #7f8c8d;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.member-details {
  display: flex;
  gap: 1rem;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.member-age {
  color: #3498db;
  font-weight: 500;
}

.member-gender {
  color: #7f8c8d;
}

.member-address {
  color: #7f8c8d;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.member-callings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
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

.member-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
}

.action-btn.delete:hover {
  background: #fee;
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
  max-width: 600px;
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

.member-detail-grid {
  display: grid;
  gap: 1rem;
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

.callings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.calling-item {
  background: #e8f4fd;
  color: #3498db;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
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

/* Mobile and Tablet Responsive Design */
@media (max-width: 1024px) {
  .members-view {
    padding: 1.5rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .member-card {
    padding: 1.5rem;
  }
  
  .modal-overlay {
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .members-view {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
    text-align: center;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-input {
    min-width: auto;
    flex: 1;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .member-card {
    padding: 1rem;
  }
  
  .member-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .member-header h3 {
    font-size: 1.1rem;
  }
  
  .member-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .btn-small {
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .member-details {
    gap: 0.5rem;
  }
  
  .detail-item {
    font-size: 0.9rem;
  }
  
  .detail-item label {
    font-size: 0.8rem;
  }
  
  .callings-list {
    gap: 0.4rem;
  }
  
  .calling-item {
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
  }
  
  .members-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-card h3 {
    font-size: 1.5rem;
  }
  
  .stat-card p {
    font-size: 0.9rem;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-content {
    max-width: 95%;
    max-height: 90vh;
  }
  
  .modal-header h2 {
    font-size: 1.3rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-footer .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .members-view {
    padding: 0.75rem;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .header-actions {
    gap: 0.75rem;
  }
  
  .member-card {
    padding: 0.75rem;
  }
  
  .member-header h3 {
    font-size: 1rem;
  }
  
  .btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .btn-small {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .member-details {
    gap: 0.4rem;
  }
  
  .detail-item {
    font-size: 0.85rem;
  }
  
  .detail-item label {
    font-size: 0.75rem;
  }
  
  .calling-item {
    font-size: 0.7rem;
    padding: 0.15rem 0.3rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-card h3 {
    font-size: 1.3rem;
  }
  
  .stat-card p {
    font-size: 0.8rem;
  }
  
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    max-width: 98%;
    max-height: 95vh;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 0.75rem;
  }
  
  .modal-footer {
    padding: 0.75rem;
  }
}
</style> 
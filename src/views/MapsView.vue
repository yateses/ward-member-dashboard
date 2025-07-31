<template>
  <div class="maps-view">
    <div class="header">
      <h1>🗺️ Family Locations</h1>
      <div class="map-controls">
        <button 
          @click="centerOnAllFamilies" 
          class="btn btn-secondary"
          :disabled="isLoading"
        >
          Center Map
        </button>
        <button 
          @click="toggleClusterMarkers" 
          class="btn btn-secondary"
          :disabled="isLoading"
        >
          {{ clusterMarkers ? 'Show Individual Pins' : 'Cluster Pins' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading family locations...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>⚠️ {{ error }}</p>
      <button @click="loadFamilyData" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Map Content -->
    <div v-else class="map-container">
      <!-- Google Maps Component -->
      <div class="map-wrapper">
        <GoogleMap
          :families="familiesWithLocations"
          :selected-family="selectedFamily"
          @family-selected="onFamilySelected"
          @map-loaded="onMapLoaded"
        />
      </div>

      <!-- Family Info Panel -->
      <div class="family-panel" :class="{ 'panel-expanded': selectedFamily }">
        <div v-if="!selectedFamily" class="panel-placeholder">
          <div class="placeholder-icon">👆</div>
          <h3>Select a Family</h3>
          <p>Click on any pin on the map to view family details</p>
        </div>

        <div v-else class="family-details">
          <div class="family-header">
            <h3>{{ selectedFamily.headOfHousehold }}</h3>
            <button @click="selectedFamily = null" class="btn btn-small btn-secondary">✕</button>
          </div>

          <div class="family-info">
            <div class="info-section">
              <h4>📍 Address</h4>
              <p>{{ selectedFamily.address || 'No address available' }}</p>
            </div>

            <div class="info-section">
              <h4>👥 Family Members ({{ selectedFamily.members.length }})</h4>
              <div class="members-list">
                <div 
                  v-for="member in selectedFamily.members" 
                  :key="member.id"
                  class="member-item"
                >
                  <div class="member-info">
                    <span class="member-name">{{ member.preferredName }}</span>
                    <span class="member-age">{{ member.age }} years old</span>
                  </div>
                  <div class="member-details">
                    <span v-if="member.birthDate" class="member-birthday">
                      🎂 {{ formatBirthday(member.birthDate) }}
                    </span>
                    <span v-if="member.individualPhone" class="member-phone">
                      📞 {{ member.individualPhone }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h4>📝 To-Do Items</h4>
              <div v-if="selectedFamily.todoItems.length === 0" class="empty-todos">
                <p>No to-do items for this family</p>
              </div>
              <div v-else class="todo-summary">
                <div class="todo-stats">
                  <span class="stat">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">{{ selectedFamily.todoItems.length }}</span>
                  </span>
                  <span class="stat">
                    <span class="stat-label">Completed:</span>
                    <span class="stat-value">{{ selectedFamily.todoItems.filter(item => item.completed).length }}</span>
                  </span>
                  <span class="stat">
                    <span class="stat-label">Pending:</span>
                    <span class="stat-value">{{ selectedFamily.todoItems.filter(item => !item.completed).length }}</span>
                  </span>
                </div>
                <button 
                  @click="navigateToFamily(selectedFamily.id)"
                  class="btn btn-primary"
                >
                  View Full Details
                </button>
              </div>
            </div>

            <div class="info-section">
              <h4>📅 Review Day</h4>
              <p class="review-day">
                <span class="day-label">{{ selectedFamily.reviewDay || 'Not set' }}</span>
                <span v-if="selectedFamily.reviewDay" class="day-icon">📋</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Legend -->
    <div class="map-legend">
      <div class="legend-item">
        <div class="legend-pin family-pin"></div>
        <span>Family Location</span>
      </div>
      <div class="legend-item">
        <div class="legend-pin selected-pin"></div>
        <span>Selected Family</span>
      </div>
      <div class="legend-item">
        <div class="legend-pin cluster-pin"></div>
        <span>Multiple Families</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMemberStore } from '../stores/memberStore'
import { familyService } from '../services/familyService'
import GoogleMap from '../components/GoogleMap.vue'
import type { FamilyWithMembers } from '../types/family'
import type { Member } from '../types/member'

const router = useRouter()
const memberStore = useMemberStore()

// Reactive state
const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedFamily = ref<FamilyWithMembers | null>(null)
const clusterMarkers = ref(true)
const mapLoaded = ref(false)

// Computed
const familiesWithLocations = computed(() => {
  return memberStore.families.filter(family => {
    // Check if any member in the family has an address
    return family.members.some(member => 
      member.addressStreet1 && member.addressStreet1.trim() !== ''
    )
  })
})

// Methods
const loadFamilyData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Families are already loaded in the store
    if (familiesWithLocations.value.length === 0) {
      error.value = 'No families with addresses found. Please import member data with addresses.'
    }
  } catch (err) {
    error.value = 'Failed to load family data'
    console.error('Error loading family data:', err)
  } finally {
    isLoading.value = false
  }
}

const onFamilySelected = (family: FamilyWithMembers) => {
  selectedFamily.value = family
}

const onMapLoaded = () => {
  mapLoaded.value = true
}

const centerOnAllFamilies = () => {
  // This will be handled by the GoogleMap component
  console.log('Centering map on all families')
}

const toggleClusterMarkers = () => {
  clusterMarkers.value = !clusterMarkers.value
}

const navigateToFamily = (familyId: string) => {
  router.push(`/families?family=${familyId}`)
}

const formatBirthday = (birthDate: string) => {
  const date = new Date(birthDate)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadFamilyData()
})

// Watch for member store changes
watch(() => memberStore.families, () => {
  loadFamilyData()
}, { deep: true })
</script>

<style scoped>
.maps-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.map-controls {
  display: flex;
  gap: 1rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  height: 600px;
}

.map-wrapper {
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.family-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s ease;
}

.panel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.placeholder-icon h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.placeholder-icon p {
  margin: 0;
  font-size: 0.9rem;
}

.family-details {
  height: 100%;
  overflow-y: auto;
}

.family-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.family-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.family-info {
  padding: 1.5rem;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-section p {
  margin: 0;
  color: #7f8c8d;
  line-height: 1.5;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-item {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.member-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.member-name {
  font-weight: 600;
  color: #2c3e50;
}

.member-age {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.member-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.member-birthday,
.member-phone {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.empty-todos {
  text-align: center;
  padding: 1rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
}

.todo-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.todo-stats {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #3498db;
}

.review-day {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.day-label {
  text-transform: capitalize;
  color: #3498db;
}

.day-icon {
  font-size: 1.2rem;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #2c3e50;
}

.legend-pin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.family-pin {
  background: #3498db;
}

.selected-pin {
  background: #e74c3c;
}

.cluster-pin {
  background: #f39c12;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .map-container {
    grid-template-columns: 1fr;
    grid-template-rows: 400px 300px;
  }
}

@media (max-width: 768px) {
  .maps-view {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .map-controls {
    justify-content: center;
  }
  
  .map-container {
    grid-template-rows: 300px 250px;
  }
  
  .map-legend {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
}
</style> 
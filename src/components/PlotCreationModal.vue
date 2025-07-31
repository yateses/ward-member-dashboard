<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Add Plot Location</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div class="coordinates-info">
          <h4>Selected Location</h4>
          <p>X: {{ coordinates.x.toFixed(1) }}%, Y: {{ coordinates.y.toFixed(1) }}%</p>
        </div>
        
        <div class="family-selection">
          <label for="familySelect">Select Family for this Plot:</label>
          <select 
            id="familySelect"
            v-model="selectedFamilyId" 
            class="family-select"
            @change="onFamilyChange"
          >
            <option value="">-- Select a Family --</option>
            <option 
              v-for="family in availableFamilies" 
              :key="family.id" 
              :value="family.id"
            >
              {{ family.headOfHousehold }} ({{ family.address || 'No address' }})
            </option>
          </select>
        </div>
        
        <div v-if="selectedFamily" class="family-preview">
          <h5>Selected Family:</h5>
          <div class="family-details">
            <p><strong>Head of Household:</strong> {{ selectedFamily.headOfHousehold }}</p>
            <p><strong>Address:</strong> {{ selectedFamily.address || 'No address available' }}</p>
            <p><strong>Members:</strong> {{ selectedFamily.members.length }}</p>
            <div class="member-list">
              <span 
                v-for="member in selectedFamily.members" 
                :key="member.id"
                class="member-tag"
              >
                {{ member.preferredName }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="notes-section">
          <label for="plotNotes">Notes (Optional):</label>
          <textarea 
            id="plotNotes"
            v-model="plotNotes" 
            class="notes-input"
            placeholder="Add any additional notes about this plot location..."
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn-secondary">Cancel</button>
        <button @click="createPlot" class="btn-primary" :disabled="!selectedFamilyId">
          Create Plot
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FamilyWithMembers } from '@/types/family';

// Props
interface Props {
  show: boolean;
  coordinates: { x: number; y: number };
  families: FamilyWithMembers[];
  existingPlots: Array<{ familyId?: string }>;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  create: [plot: { address: string; x: number; y: number; familyId: string; notes: string }];
}>();

// Reactive data
const selectedFamilyId = ref('');
const plotNotes = ref('');

// Computed
const availableFamilies = computed(() => {
  // Filter out families that already have plots assigned or don't have addresses
  return props.families.filter(family => 
    family.address && 
    family.address.trim() !== '' &&
    !props.existingPlots.some(plot => plot.familyId === family.id)
  );
});

const selectedFamily = computed(() => {
  return props.families.find(f => f.id === selectedFamilyId.value);
});

// Methods
const closeModal = () => {
  selectedFamilyId.value = '';
  plotNotes.value = '';
  emit('close');
};

const onFamilyChange = () => {
  // Auto-fill notes with family info if empty
  if (selectedFamily.value && !plotNotes.value) {
    plotNotes.value = `Plot for ${selectedFamily.value.headOfHousehold} family`;
  }
};

const createPlot = () => {
  if (selectedFamilyId.value && selectedFamily.value) {
    const plot = {
      address: selectedFamily.value.address || '',
      x: props.coordinates.x,
      y: props.coordinates.y,
      familyId: selectedFamilyId.value,
      notes: plotNotes.value
    };
    emit('create', plot);
    closeModal();
  }
};

// Watch for show changes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    closeModal();
  }
});
</script>

<style scoped>
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
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.coordinates-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.coordinates-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.coordinates-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.family-selection {
  margin-bottom: 20px;
}

.family-selection label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.family-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.family-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.family-preview {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.family-preview h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.family-details p {
  margin: 5px 0;
  font-size: 14px;
}

.member-list {
  margin-top: 10px;
}

.member-tag {
  display: inline-block;
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin: 2px;
}

.notes-section {
  margin-bottom: 20px;
}

.notes-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.notes-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.notes-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #545b62;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}
</style> 
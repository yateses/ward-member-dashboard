<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Assign Family to Plot</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div class="plot-info">
          <h4>{{ plot.address }}</h4>
          <p v-if="plot.notes">{{ plot.notes }}</p>
        </div>
        
        <div class="family-selection">
          <label for="familySelect">Select Family:</label>
          <select 
            id="familySelect"
            v-model="selectedFamilyId" 
            class="family-select"
          >
            <option value="">-- No Family Assigned --</option>
            <option 
              v-for="family in availableFamilies" 
              :key="family.id" 
              :value="family.id"
            >
              {{ family.name }} ({{ family.address }})
            </option>
          </select>
        </div>
        
        <div v-if="selectedFamily" class="family-preview">
          <h5>Selected Family:</h5>
          <div class="family-details">
            <p><strong>Name:</strong> {{ selectedFamily.name }}</p>
            <p><strong>Address:</strong> {{ selectedFamily.address }}</p>
            <p><strong>Members:</strong> {{ selectedFamily.members.length }}</p>
            <div class="member-list">
              <span 
                v-for="member in selectedFamily.members" 
                :key="member.name"
                class="member-tag"
              >
                {{ member.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn-secondary">Cancel</button>
        <button @click="assignFamily" class="btn-primary" :disabled="!selectedFamilyId">
          Assign Family
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PlotLocation } from '@/types/image-map';
import type { FamilyWithMembers } from '@/types/family';

// Props
interface Props {
  show: boolean;
  plot: PlotLocation | null;
  families: FamilyWithMembers[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  assign: [plotId: string, familyId: string];
}>();

// Reactive data
const selectedFamilyId = ref('');

// Computed
const availableFamilies = computed(() => {
  return props.families.filter(family => 
    !family.address || family.address.toLowerCase() !== props.plot?.address.toLowerCase()
  );
});

const selectedFamily = computed(() => {
  return props.families.find(f => f.id === selectedFamilyId.value);
});

// Methods
const closeModal = () => {
  selectedFamilyId.value = '';
  emit('close');
};

const assignFamily = () => {
  if (props.plot && selectedFamilyId.value) {
    emit('assign', props.plot.id, selectedFamilyId.value);
    closeModal();
  }
};

// Watch for plot changes
watch(() => props.plot, (newPlot) => {
  if (newPlot) {
    selectedFamilyId.value = newPlot.familyId || '';
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

.plot-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.plot-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.plot-info p {
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
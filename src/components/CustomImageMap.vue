<template>
  <div class="custom-image-map">
    <div class="map-container" ref="mapContainer">
      <img 
        :src="mapConfig?.imageUrl || '/placeholder-map.jpg'" 
        :alt="mapConfig?.imageAlt || 'Area Map'"
        @load="onImageLoad"
        @click="handleMapClick"
        class="map-image"
        ref="mapImage"
      />
      
             <!-- Plot pins -->
               <div 
          v-for="plot in plotsWithFamilies" 
          :key="`${plot.id}-${forceUpdate}`"
          class="plot-pin"
          :class="{ 
            'has-family': plot.family,
            'selected': selectedPlot?.id === plot.id,
            'dragging': draggingPlot?.id === plot.id
          }"
          :style="getPinPosition(plot)"
          @click.stop="selectPlot(plot)"
          @mousedown="startDrag($event, plot)"
          @mouseenter="startHoverTimer(plot)"
          @mouseleave="clearHoverTimer"
        >
         <div class="pin-marker">
           <span class="pin-number">{{ getPinNumber(plot) }}</span>
         </div>
         <!-- Delete button (admin mode only) -->
         <button 
           v-if="isAdminMode" 
           @click.stop="deletePlot(plot)"
           class="delete-pin-btn"
           title="Delete plot"
         >
           ×
         </button>
       </div>
       
       <!-- Hover tooltip -->
       <div 
         v-if="hoveredPlot && showHoverTooltip" 
         class="hover-tooltip"
         :style="getTooltipPosition()"
       >
         <div class="tooltip-content">
           <h4>{{ hoveredPlot.address }}</h4>
           <div v-if="hoveredPlot.family" class="tooltip-family-info">
             <p><strong>{{ hoveredPlot.family.name }}</strong></p>
             <p v-if="hoveredPlot.family.phone">📞 {{ hoveredPlot.family.phone }}</p>
             <p v-if="hoveredPlot.family.email">✉️ {{ hoveredPlot.family.email }}</p>
             <p><strong>Members:</strong> {{ hoveredPlot.family.members.length }}</p>
           </div>
           <div v-else class="tooltip-no-family">
             <p>No family assigned</p>
           </div>
         </div>
       </div>
    </div>

         <!-- Family info panel below map -->
     <div v-if="selectedPlot" class="family-info-panel-below">
       <div class="panel-header">
         <h3>{{ selectedPlot.address }}</h3>
         <button @click="selectedPlot = null" class="close-btn">×</button>
       </div>
       
       <div v-if="selectedPlot.family" class="family-card">
         <div class="family-header">
           <h4>{{ selectedPlot.family.name }}</h4>
           <div class="family-contact">
             <span v-if="selectedPlot.family.phone" class="contact-item">
               📞 {{ selectedPlot.family.phone }}
             </span>
             <span v-if="selectedPlot.family.email" class="contact-item">
               ✉️ {{ selectedPlot.family.email }}
             </span>
           </div>
         </div>
         
         <div class="family-members-section">
           <h5>Family Members:</h5>
           <div class="members-list">
             <div 
               v-for="member in selectedPlot.family.members" 
               :key="member.name"
               class="member-item"
             >
               <span class="member-name">{{ member.name }}</span>
               <span class="member-age">({{ member.age }})</span>
               <span class="member-birthdate">{{ formatDate(member.birthdate) }}</span>
             </div>
           </div>
         </div>
         
         <div class="family-actions">
           <button @click="assignFamily(selectedPlot)" class="action-btn">
             Reassign Family
           </button>
         </div>
       </div>
       
       <div v-else class="no-family">
         <div class="no-family-content">
           <p>No family assigned to this address.</p>
           <button @click="assignFamily(selectedPlot)" class="assign-btn">
             Assign Family
           </button>
         </div>
       </div>
     </div>

    <!-- Admin controls -->
    <div v-if="isAdminMode" class="admin-controls">
      <button @click="addPlotMode = !addPlotMode" class="admin-btn">
        {{ addPlotMode ? 'Cancel' : 'Add Plot' }}
      </button>
      <button @click="savePlotLocations" class="admin-btn" :disabled="!hasUnsavedChanges">
        Save Changes
      </button>
    </div>

    <!-- Family Assignment Modal -->
    <FamilyAssignmentModal
      :show="showAssignmentModal"
      :plot="assignmentPlot"
      :families="families"
      @close="showAssignmentModal = false"
      @assign="handleFamilyAssignment"
    />

    <!-- Plot Creation Modal -->
    <PlotCreationModal
      :show="showPlotCreationModal"
      :coordinates="plotCreationCoordinates"
      :families="families"
      :existing-plots="plots"
      @close="showPlotCreationModal = false"
      @create="handlePlotCreation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ImageMapService } from '@/services/imageMapService';
import { familyService } from '@/services/familyService';
import { MemberService } from '@/services/memberService';
import FamilyAssignmentModal from './FamilyAssignmentModal.vue';
import PlotCreationModal from './PlotCreationModal.vue';
import type { PlotLocation, PlotWithFamily, ImageMapConfig } from '@/types/image-map';
import type { FamilyWithMembers } from '@/types/family';

// Props
interface Props {
  isAdminMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isAdminMode: false
});

// Reactive data
const mapContainer = ref<HTMLElement>();
const mapImage = ref<HTMLImageElement>();
const selectedPlot = ref<PlotWithFamily | null>(null);
const addPlotMode = ref(false);
const hasUnsavedChanges = ref(false);
const showAssignmentModal = ref(false);
const assignmentPlot = ref<PlotLocation | null>(null);
const showPlotCreationModal = ref(false);
const plotCreationCoordinates = ref({ x: 0, y: 0 });

const plots = ref<PlotLocation[]>([]);
const families = ref<FamilyWithMembers[]>([]);
const mapConfig = ref<ImageMapConfig | null>(null);
const plotsWithFamilies = ref<PlotWithFamily[]>([]);

// Dragging state
const draggingPlot = ref<PlotWithFamily | null>(null);
const isDragging = ref(false);

// Hover state
const hoveredPlot = ref<PlotWithFamily | null>(null);
const showHoverTooltip = ref(false);
const hoverTimer = ref<number | null>(null);

// Force re-render when window resizes
const forceUpdate = ref(0);



// Computed
const getPinNumber = (plot: PlotWithFamily) => {
  const index = plotsWithFamilies.value.findIndex(p => p.id === plot.id);
  return index + 1;
};

// Methods
const loadData = async () => {
  try {
    const [plotsData, membersData, configData] = await Promise.all([
      ImageMapService.getPlotLocations(),
      MemberService.getAllMembers(),
      ImageMapService.getImageMapConfig()
    ]);
    
    plots.value = plotsData;
    const familiesData = await familyService.getFamiliesWithMembers(membersData);
    families.value = familiesData;
    mapConfig.value = configData;
    
    // Combine plots with family data
    plotsWithFamilies.value = await ImageMapService.getPlotsWithFamilies(familiesData);
  } catch (error) {
    console.error('Error loading map data:', error);
  }
};

const onImageLoad = () => {
  // Image loaded, ready for interactions
  console.log('Map image loaded');
};

const handleMapClick = (event: MouseEvent) => {
  if (!props.isAdminMode || !addPlotMode.value || isDragging.value) return;
  
  const rect = mapImage.value?.getBoundingClientRect();
  if (!rect) return;
  
  // Calculate coordinates relative to the actual image area
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  
  // Store coordinates and show plot creation modal
  plotCreationCoordinates.value = { x, y };
  showPlotCreationModal.value = true;
};

const getPinPosition = (plot: PlotWithFamily) => {
  if (!mapImage.value) {
    return { left: `${plot.x}%`, top: `${plot.y}%` };
  }

  const container = mapImage.value.parentElement;
  if (!container) {
    return { left: `${plot.x}%`, top: `${plot.y}%` };
  }

  const containerRect = container.getBoundingClientRect();
  const imageRect = mapImage.value.getBoundingClientRect();
  
  // Calculate the actual image position within the container
  const imageLeft = imageRect.left - containerRect.left;
  const imageTop = imageRect.top - containerRect.top;
  const imageWidth = imageRect.width;
  const imageHeight = imageRect.height;
  
  // Convert percentage coordinates to actual pixel positions on the image
  const pinX = imageLeft + (plot.x / 100) * imageWidth;
  const pinY = imageTop + (plot.y / 100) * imageHeight;
  
  // Convert back to percentages relative to the container
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  
  const leftPercent = (pinX / containerWidth) * 100;
  const topPercent = (pinY / containerHeight) * 100;
  
  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`
  };
};

const selectPlot = (plot: PlotWithFamily) => {
  selectedPlot.value = plot;
};

const startHoverTimer = (plot: PlotWithFamily) => {
  clearHoverTimer();
  hoveredPlot.value = plot;
  
  hoverTimer.value = window.setTimeout(() => {
    showHoverTooltip.value = true;
  }, 1000); // 1 second delay
};

const clearHoverTimer = () => {
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
    hoverTimer.value = null;
  }
  hoveredPlot.value = null;
  showHoverTooltip.value = false;
};

const getTooltipPosition = () => {
  if (!hoveredPlot.value || !mapImage.value) {
    return { left: '0px', top: '0px' };
  }
  
  const rect = mapImage.value.getBoundingClientRect();
  const x = (hoveredPlot.value.x / 100) * rect.width;
  const y = (hoveredPlot.value.y / 100) * rect.height;
  
  // Position tooltip above and to the right of the pin
  return {
    left: `${x + 20}px`,
    top: `${y - 60}px`
  };
};

const startDrag = (event: MouseEvent, plot: PlotWithFamily) => {
  if (!props.isAdminMode) return;
  
  event.preventDefault();
  isDragging.value = true;
  draggingPlot.value = plot;
  
  // Add global mouse event listeners
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value || !draggingPlot.value || !mapImage.value) return;
  
  const rect = mapImage.value.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  
  // Clamp coordinates to image bounds
  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));
  
  // Update the plot coordinates
  const plotIndex = plots.value.findIndex(p => p.id === draggingPlot.value!.id);
  if (plotIndex !== -1) {
    plots.value[plotIndex].x = clampedX;
    plots.value[plotIndex].y = clampedY;
    hasUnsavedChanges.value = true;
  }
  
  // Update the plotsWithFamilies array
  const plotWithFamilyIndex = plotsWithFamilies.value.findIndex(p => p.id === draggingPlot.value!.id);
  if (plotWithFamilyIndex !== -1) {
    plotsWithFamilies.value[plotWithFamilyIndex].x = clampedX;
    plotsWithFamilies.value[plotWithFamilyIndex].y = clampedY;
  }
};

const stopDrag = () => {
  isDragging.value = false;
  draggingPlot.value = null;
  
  // Remove global mouse event listeners
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const deletePlot = async (plot: PlotWithFamily) => {
  if (!props.isAdminMode) return;
  
  if (confirm(`Are you sure you want to delete the plot at ${plot.address}?`)) {
    try {
      // Remove from local arrays
      const plotIndex = plots.value.findIndex(p => p.id === plot.id);
      if (plotIndex !== -1) {
        plots.value.splice(plotIndex, 1);
      }
      
      const plotWithFamilyIndex = plotsWithFamilies.value.findIndex(p => p.id === plot.id);
      if (plotWithFamilyIndex !== -1) {
        plotsWithFamilies.value.splice(plotWithFamilyIndex, 1);
      }
      
      // Clear selection if this was the selected plot
      if (selectedPlot.value?.id === plot.id) {
        selectedPlot.value = null;
      }
      
      // Delete from database if it's not a temporary plot
      if (!plot.id.startsWith('temp-')) {
        await ImageMapService.deletePlotLocation(plot.id);
      }
      
      hasUnsavedChanges.value = true;
    } catch (error) {
      console.error('Error deleting plot:', error);
      alert('Failed to delete plot. Please try again.');
    }
  }
};

const assignFamily = (plot: PlotLocation) => {
  assignmentPlot.value = plot;
  showAssignmentModal.value = true;
};

const handleFamilyAssignment = async (plotId: string, familyId: string) => {
  try {
    await ImageMapService.updatePlotLocation(plotId, { familyId });
    
    // Update local state
    const plotIndex = plots.value.findIndex(p => p.id === plotId);
    if (plotIndex !== -1) {
      plots.value[plotIndex].familyId = familyId;
    }
    
    // Reload plots with families
    await updatePlotsWithFamilies();
    
    // Update selected plot if it's the one we just assigned
    if (selectedPlot.value?.id === plotId) {
      const updatedPlot = plotsWithFamilies.value.find(p => p.id === plotId);
      if (updatedPlot) {
        selectedPlot.value = updatedPlot;
      }
    }
  } catch (error) {
    console.error('Error assigning family to plot:', error);
  }
};

const handlePlotCreation = (plotData: { address: string; x: number; y: number; familyId: string; notes: string }) => {
  const newPlot: Omit<PlotLocation, 'id'> = {
    address: plotData.address,
    x: plotData.x,
    y: plotData.y,
    familyId: plotData.familyId,
    notes: plotData.notes
  };
  
  plots.value.push({ ...newPlot, id: `temp-${Date.now()}` });
  hasUnsavedChanges.value = true;
  
  // Update plots with families
  updatePlotsWithFamilies();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const updatePlotsWithFamilies = async () => {
  try {
    plotsWithFamilies.value = await ImageMapService.getPlotsWithFamilies(families.value);
  } catch (error) {
    console.error('Error updating plots with families:', error);
  }
};

const savePlotLocations = async () => {
  try {
    // Save each plot location
    for (const plot of plots.value) {
      if (plot.id.startsWith('temp-')) {
        // New plot
        const id = await ImageMapService.savePlotLocation({
          address: plot.address,
          x: plot.x,
          y: plot.y,
          familyId: plot.familyId,
          notes: plot.notes
        });
        plot.id = id;
      } else {
        // Existing plot - update if needed
        await ImageMapService.updatePlotLocation(plot.id, {
          address: plot.address,
          x: plot.x,
          y: plot.y,
          familyId: plot.familyId,
          notes: plot.notes
        });
      }
    }
    
    hasUnsavedChanges.value = false;
    await loadData(); // Reload data
  } catch (error) {
    console.error('Error saving plot locations:', error);
  }
};

// Lifecycle
onMounted(() => {
  loadData();
  
  // Add resize listener to recalculate pin positions
  const handleResize = () => {
    forceUpdate.value++;
  };
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
});

// Cleanup on unmount
onUnmounted(() => {
  // Remove any remaining event listeners
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('resize', () => {});
  
  // Clear any remaining timers
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value);
  }
});

// Watch for changes
watch(plots, () => {
  hasUnsavedChanges.value = true;
}, { deep: true });
</script>

<style scoped>
.custom-image-map {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.map-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  width: 100%;
  max-width: 1200px;
  aspect-ratio: 16/10;
  background: #f0f0f0;
  margin-left: auto;
  margin-right: auto;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: crosshair;
}

.plot-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.plot-pin:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.plot-pin.selected {
  z-index: 10;
}

.plot-pin.dragging {
  z-index: 20;
  cursor: grabbing;
}

.plot-pin.dragging .pin-marker {
  transform: scale(1.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.pin-marker {
  width: 24px;
  height: 24px;
  background: #dc3545;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.plot-pin.has-family .pin-marker {
  background: #28a745;
}

.plot-pin.selected .pin-marker {
  background: #007bff;
  border: 3px solid #0056b3;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.pin-number {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.delete-pin-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #dc3545;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.plot-pin:hover .delete-pin-btn {
  opacity: 1;
}

.delete-pin-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.hover-tooltip {
  position: absolute;
  z-index: 30;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in;
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  max-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 4px;
}

.tooltip-family-info p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.3;
}

.tooltip-no-family p {
  margin: 0;
  font-style: italic;
  color: #ccc;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.family-info-panel-below {
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
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

.family-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 10px;
}

.family-header {
  margin-bottom: 16px;
}

.family-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.family-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.contact-item {
  font-size: 14px;
  color: #666;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.family-members-section {
  margin-bottom: 16px;
}

.family-members-section h5 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.members-list {
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.member-item:last-child {
  border-bottom: none;
}

.member-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.member-age {
  color: #666;
  margin: 0 8px;
}

.member-birthdate {
  color: #888;
  font-size: 13px;
}

.family-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #545b62;
}

.no-family {
  text-align: center;
  color: #666;
  padding: 20px;
}

.no-family-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 2px dashed #dee2e6;
}

.assign-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.assign-btn:hover {
  background: #0056b3;
}

.admin-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
}

.admin-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.admin-btn:hover:not(:disabled) {
  background: #545b62;
}

.admin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 
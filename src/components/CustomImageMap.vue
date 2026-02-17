<template>
  <div class="custom-image-map">
    <div class="map-section">
      <div class="map-container" ref="mapContainer" :style="effectiveContainerStyle">
                 <img 
           :src="mapConfig?.imageUrl || '/placeholder-map.jpg'" 
           :alt="mapConfig?.imageAlt || 'Ward Map'"
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
          </div>
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

      <!-- Admin controls -->
      <div v-if="isAdminMode" class="admin-controls">
        <button @click="addPlotMode = !addPlotMode" class="admin-btn">
          {{ addPlotMode ? 'Cancel' : 'Add Plot' }}
        </button>
        <button 
          @click="deleteSelectedPlot" 
          class="admin-btn delete-selected-btn" 
          :disabled="!selectedPlot"
          title="Delete selected pin"
        >
          Delete Selected Pin
        </button>
        <button @click="savePlotLocations" class="admin-btn" :disabled="!hasUnsavedChanges">
          Save Changes
        </button>
      </div>
    </div>

    <!-- Family card section -->
    <div class="family-card-section">
      <div v-if="selectedPlot" class="family-card-container">
        <div class="family-card-header">
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
          
          <!-- Todo items section -->
          <div class="todo-section">
            <div class="todo-header">
              <h5>To-Do Items</h5>
              <div class="todo-controls">
                <label class="show-completed-toggle">
                  <input 
                    type="checkbox" 
                    v-model="showCompletedTodos"
                    @change="toggleShowCompleted"
                  />
                  Show completed
                </label>
                <button @click="openAddTodo" class="add-todo-btn">+ Add Todo</button>
              </div>
            </div>
            
            <div class="todo-list">
              <div 
                v-for="todo in filteredTodos" 
                :key="todo.id"
                class="todo-item"
                :class="{ 'completed': todo.completed }"
              >
                <div class="todo-content">
                  <input 
                    type="checkbox" 
                    :checked="todo.completed"
                    @change="toggleTodoItem(todo)"
                    class="todo-checkbox"
                  />
                  <div class="todo-details">
                    <div class="todo-title">{{ todo.title }}</div>
                    <div class="todo-meta">
                      <span class="todo-category">{{ todo.category }}</span>
                      <span class="todo-priority" :class="`priority-${todo.priority}`">
                        {{ todo.priority }}
                      </span>
                    </div>
                  </div>
                  <button @click="openEditTodo(todo)" class="edit-todo-btn">✏️</button>
                </div>
              </div>
              
              <div v-if="filteredTodos.length === 0" class="no-todos">
                <p>No to-do items yet.</p>
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
      
      <div v-else class="no-selection">
        <div class="no-selection-content">
          <h3>Select a Pin</h3>
          <p>Click on any pin on the map to view family information and manage to-do items.</p>
        </div>
      </div>
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

    <!-- Todo Item Editor Modal -->
    <TodoItemEditor
      :show="showTodoEditor"
      :todo="editingTodo"
      :family-id="selectedPlot?.family?.id"
      @close="closeTodoEditor"
      @save="saveTodoItem"
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
import TodoItemEditor from './TodoItemEditor.vue';
import type { PlotLocation, PlotWithFamily, ImageMapConfig } from '@/types/image-map';
import type { FamilyWithMembers, TodoItem } from '@/types/family';

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

// Map image dimensions for dynamic aspect ratio
const imageDimensions = ref({ width: 0, height: 0 });
const containerStyle = ref({});

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

// Todo functionality
const showCompletedTodos = ref(false);
const showTodoEditor = ref(false);
const editingTodo = ref<TodoItem | null>(null);



// Computed
const filteredTodos = computed(() => {
  if (!selectedPlot.value?.family?.todoItems) return [];
  
  const todos = selectedPlot.value.family.todoItems;
  if (showCompletedTodos.value) {
    return todos.sort((a, b) => {
      // Sort by priority first, then by title
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return a.title.localeCompare(b.title);
    });
  } else {
    return todos
      .filter(todo => !todo.completed)
      .sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return a.title.localeCompare(b.title);
      });
  }
});

const effectiveContainerStyle = computed(() => {
  // If we have calculated dimensions, use them
  if (Object.keys(containerStyle.value).length > 0) {
    return containerStyle.value;
  }
  
  // Fallback to a reasonable default aspect ratio (4:3)
  return {
    aspectRatio: '4/3',
    maxHeight: '800px',
    width: '100%'
  };
});

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

const updateContainerStyle = () => {
  if (imageDimensions.value.width > 0 && imageDimensions.value.height > 0) {
    const aspectRatio = imageDimensions.value.width / imageDimensions.value.height;
    containerStyle.value = {
      aspectRatio: aspectRatio.toString(),
      maxHeight: '800px',
      width: '100%'
    };
  }
};

const handleWindowResize = () => {
  // Force re-render of pins when window resizes
  forceUpdate.value++;
  // Update container style to maintain aspect ratio
  updateContainerStyle();
};

const onImageLoad = () => {
  // Image loaded, ready for interactions
  console.log('Map image loaded');
  
  if (mapImage.value) {
    const img = mapImage.value;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    console.log('Image natural dimensions:', naturalWidth, 'x', naturalHeight);
    
    // Store the natural dimensions
    imageDimensions.value = { width: naturalWidth, height: naturalHeight };
    
    // Update container style with calculated aspect ratio
    updateContainerStyle();
  }
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

const deleteSelectedPlot = async () => {
  if (!selectedPlot.value) return;
  
  await deletePlot(selectedPlot.value);
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

// Todo methods
const toggleShowCompleted = () => {
  // This is handled by the v-model on the checkbox
};

const openAddTodo = () => {
  editingTodo.value = null;
  showTodoEditor.value = true;
};

const openEditTodo = (todo: TodoItem) => {
  editingTodo.value = { ...todo };
  showTodoEditor.value = true;
};

const closeTodoEditor = () => {
  showTodoEditor.value = false;
  editingTodo.value = null;
};

const saveTodoItem = async (todoData: { title: string; category: string; priority: string }) => {
  if (!selectedPlot.value?.family?.id) return;
  
  try {
    if (editingTodo.value) {
      // Update existing todo
      await familyService.updateTodoItem(editingTodo.value.id, {
        title: todoData.title,
        category: todoData.category,
        priority: todoData.priority
      });
    } else {
      // Add new todo
      await familyService.addTodoItem(selectedPlot.value.family.id, {
        title: todoData.title,
        category: todoData.category,
        priority: todoData.priority
      });
    }
    
    // Reload the selected plot to get updated todo items
    await loadData();
    
    // Update the selected plot with fresh data
    if (selectedPlot.value) {
      const updatedPlot = plotsWithFamilies.value.find(p => p.id === selectedPlot.value!.id);
      if (updatedPlot) {
        selectedPlot.value = updatedPlot;
      }
    }
    
    closeTodoEditor();
  } catch (error) {
    console.error('Error saving todo item:', error);
  }
};

const toggleTodoItem = async (todo: TodoItem) => {
  try {
    await familyService.updateTodoItem(todo.id, {
      completed: !todo.completed
    });
    
    // Reload the selected plot to get updated todo items
    await loadData();
    
    // Update the selected plot with fresh data
    if (selectedPlot.value) {
      const updatedPlot = plotsWithFamilies.value.find(p => p.id === selectedPlot.value!.id);
      if (updatedPlot) {
        selectedPlot.value = updatedPlot;
      }
    }
  } catch (error) {
    console.error('Error toggling todo item:', error);
  }
};

// Lifecycle
onMounted(() => {
  loadData();
  
  // Add resize listener to recalculate pin positions and container style
  window.addEventListener('resize', handleWindowResize);
});

// Cleanup on unmount
onUnmounted(() => {
  // Remove any remaining event listeners
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('resize', handleWindowResize);
  
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
  height: 100%;
  gap: 20px;
  padding: 20px;
}

.map-section {
  flex: 1;
  position: relative;
}

.map-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  background: #f0f0f0;
  /* Height will be controlled by aspect-ratio from containerStyle */
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
  width: 16px;
  height: 16px;
  background: #dc3545;
  border: 2px solid white;
  border-radius: 50%;
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





/* Mobile optimization for pins */
@media (max-width: 768px) {
  .pin-marker {
    width: 12px;
    height: 12px;
    border-width: 1px;
  }
  

  
  .plot-pin:hover {
    transform: translate(-50%, -50%) scale(1.05);
  }
  
  .plot-pin.selected .pin-marker {
    transform: scale(1.05);
  }
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

.family-card {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.family-header {
  margin-bottom: 20px;
}

.family-header h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.family-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-item {
  font-size: 14px;
  color: #666;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.family-members-section {
  margin-bottom: 20px;
}

.family-members-section h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.members-list {
  background: #f8f9fa;
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

/* Todo section styles */
.todo-section {
  margin-bottom: 20px;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.todo-header h5 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.todo-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.show-completed-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.show-completed-toggle input[type="checkbox"] {
  margin: 0;
}

.add-todo-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.add-todo-btn:hover {
  background: #0056b3;
}

.todo-list {
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.todo-item {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: #666;
}

.todo-content {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 10px;
}

.todo-checkbox {
  margin: 0;
  cursor: pointer;
}

.todo-details {
  flex: 1;
}

.todo-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.todo-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.todo-category {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 3px;
}

.todo-priority {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.priority-High {
  background: #f8d7da;
  color: #721c24;
}

.priority-Medium {
  background: #fff3cd;
  color: #856404;
}

.priority-Low {
  background: #d1ecf1;
  color: #0c5460;
}

.edit-todo-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.edit-todo-btn:hover {
  background: #e9ecef;
}

.no-todos {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.family-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #545b62;
}

.no-family {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.no-family-content {
  text-align: center;
  color: #666;
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

.family-card-section {
  width: 400px;
  min-height: 800px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.family-card-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.family-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.family-card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.no-selection {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.no-selection-content {
  text-align: center;
  color: #666;
}

.no-selection-content h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.no-selection-content p {
  margin: 0;
  line-height: 1.5;
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

.delete-selected-btn {
  background: #dc3545;
}

.delete-selected-btn:hover:not(:disabled) {
  background: #c82333;
}

.delete-selected-btn:disabled {
  background: #6c757d;
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile responsive styles */
@media (max-width: 1024px) {
  .custom-image-map {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .family-card-section {
    width: 100%;
    min-height: 500px;
  }
  
  /* Container height will be controlled by aspect-ratio */
}

@media (max-width: 768px) {
  .custom-image-map {
    padding: 10px;
    gap: 10px;
  }
  
  /* Container height will be controlled by aspect-ratio */
  
  .family-card-section {
    min-height: 450px;
  }
  
  .family-card {
    padding: 15px;
  }
  
  .family-card-header {
    padding: 15px;
  }
  
  .todo-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .todo-content {
    padding: 10px;
  }
  
  .todo-meta {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  /* Container height will be controlled by aspect-ratio */
  
  .family-card-section {
    min-height: 350px;
  }
  
  .family-card {
    padding: 10px;
  }
  
  .family-card-header {
    padding: 10px;
  }
  
  .family-card-header h3 {
    font-size: 16px;
  }
  
  .family-header h4 {
    font-size: 18px;
  }
}
</style> 
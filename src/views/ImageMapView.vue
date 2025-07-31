<template>
  <div class="image-map-view">
    <div class="view-header">
      <h1>Area Map</h1>
      <div class="header-controls">
        <button 
          @click="isAdminMode = !isAdminMode" 
          class="admin-toggle-btn"
          :class="{ active: isAdminMode }"
        >
          {{ isAdminMode ? 'Exit Admin' : 'Admin Mode' }}
        </button>
        <button @click="showConfigModal = true" class="config-btn">
          Map Settings
        </button>
      </div>
    </div>

    <div class="map-content">
      <CustomImageMap :is-admin-mode="isAdminMode" />
    </div>

    <!-- Configuration Modal -->
    <div v-if="showConfigModal" class="modal-overlay" @click="showConfigModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Map Configuration</h3>
          <button @click="showConfigModal = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="imageUrl">Map Image URL:</label>
            <input 
              id="imageUrl"
              v-model="configForm.imageUrl" 
              type="text" 
              placeholder="Enter the URL of your map image"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="imageAlt">Image Alt Text:</label>
            <input 
              id="imageAlt"
              v-model="configForm.imageAlt" 
              type="text" 
              placeholder="Description of the map"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>Upload Image:</label>
            <input 
              type="file" 
              accept="image/*" 
              @change="handleImageUpload"
              class="form-input"
            />
            <small>Upload an image file to use as your map</small>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showConfigModal = false" class="btn-secondary">Cancel</button>
          <button @click="saveConfig" class="btn-primary">Save Configuration</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CustomImageMap from '@/components/CustomImageMap.vue';
import { ImageMapService } from '@/services/imageMapService';
import type { ImageMapConfig } from '@/types/image-map';

// Reactive data
const isAdminMode = ref(false);
const showConfigModal = ref(false);
const configForm = ref({
  imageUrl: '',
  imageAlt: ''
});

// Methods
const loadConfig = async () => {
  try {
    const config = await ImageMapService.getImageMapConfig();
    if (config) {
      configForm.value = {
        imageUrl: config.imageUrl,
        imageAlt: config.imageAlt
      };
    }
  } catch (error) {
    console.error('Error loading map config:', error);
  }
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    // For now, we'll use a placeholder approach
    // In a real implementation, you'd upload to a storage service
    const reader = new FileReader();
    reader.onload = (e) => {
      configForm.value.imageUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const saveConfig = async () => {
  try {
    const config: ImageMapConfig = {
      imageUrl: configForm.value.imageUrl,
      imageAlt: configForm.value.imageAlt,
      plots: [] // This will be managed separately
    };
    
    await ImageMapService.saveImageMapConfig(config);
    showConfigModal.value = false;
    
    // Reload the page to apply the new configuration
    window.location.reload();
  } catch (error) {
    console.error('Error saving map config:', error);
  }
};

// Lifecycle
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.image-map-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.view-header h1 {
  margin: 0;
  color: #333;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.admin-toggle-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.admin-toggle-btn.active {
  background: #dc3545;
}

.admin-toggle-btn:hover {
  opacity: 0.9;
}

.config-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.config-btn:hover {
  background: #0056b3;
}

.map-content {
  flex: 1;
  min-height: 0;
}

/* Modal Styles */
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
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

.btn-primary:hover {
  background: #0056b3;
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
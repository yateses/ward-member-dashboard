<template>
  <div class="google-map-container">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- Map Loading Overlay -->
    <div v-if="!mapLoaded" class="map-loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading map...</p>
    </div>
    
    <!-- Map Error Overlay -->
    <div v-if="mapError" class="map-error-overlay">
      <div class="error-content">
        <p>⚠️ {{ mapError }}</p>
        <button @click="initializeMap" class="btn btn-secondary">Retry</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import type { FamilyWithMembers } from '../types/family'

// Props
interface Props {
  families: FamilyWithMembers[]
  selectedFamily?: FamilyWithMembers | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedFamily: null
})

// Emits
const emit = defineEmits<{
  'family-selected': [family: FamilyWithMembers]
  'map-loaded': []
}>()

// Reactive state
const mapContainer = ref<HTMLElement>()
const mapLoaded = ref(false)
const mapError = ref<string | null>(null)

// Google Maps variables
let map: google.maps.Map | null = null
let markers: google.maps.Marker[] = []
let infoWindows: google.maps.InfoWindow[] = []
let geocoder: google.maps.Geocoder | null = null

// Methods
const initializeMap = async () => {
  if (!mapContainer.value) return
  
  try {
    mapError.value = null
    
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      mapError.value = 'Google Maps failed to load. Please check your internet connection.'
      return
    }

    // Initialize the map
    map = new google.maps.Map(mapContainer.value, {
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Initialize geocoder
    geocoder = new google.maps.Geocoder()
    
    // Add markers for families
    await addFamilyMarkers()
    
    // Fit bounds to show all markers
    fitMapToMarkers()
    
    mapLoaded.value = true
    emit('map-loaded')
    
  } catch (error) {
    console.error('Error initializing map:', error)
    mapError.value = 'Failed to initialize map. Please try again.'
  }
}

const addFamilyMarkers = async () => {
  if (!map || !geocoder) return
  
  // Clear existing markers
  clearMarkers()
  
  const markerPromises = props.families.map(async (family) => {
    try {
      // Get the first member with an address
      const memberWithAddress = family.members.find(member => 
        member.addressStreet1 && member.addressStreet1.trim() !== ''
      )
      
      if (!memberWithAddress?.addressStreet1) return null
      
      // Geocode the address
      const address = memberWithAddress.addressStreet1
      const geocodeResult = await geocodeAddress(address)
      
      if (!geocodeResult) return null
      
      // Create marker
      const marker = new google.maps.Marker({
        position: geocodeResult,
        map: map,
        title: family.headOfHousehold,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#3498db" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      })
      
      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(family)
      })
      
      // Add click listener
      marker.addListener('click', () => {
        // Close all other info windows
        infoWindows.forEach(iw => iw.close())
        
        // Open this info window
        infoWindow.open(map, marker)
        
        // Emit family selected event
        emit('family-selected', family)
      })
      
      markers.push(marker)
      infoWindows.push(infoWindow)
      
      return marker
      
    } catch (error) {
      console.error(`Error adding marker for family ${family.headOfHousehold}:`, error)
      return null
    }
  })
  
  await Promise.all(markerPromises)
}

const geocodeAddress = (address: string): Promise<google.maps.LatLng | null> => {
  return new Promise((resolve) => {
    if (!geocoder) {
      resolve(null)
      return
    }
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].geometry.location)
      } else {
        console.warn(`Geocoding failed for address: ${address}`, status)
        resolve(null)
      }
    })
  })
}

const createInfoWindowContent = (family: FamilyWithMembers): string => {
  const memberWithAddress = family.members.find(member => 
    member.addressStreet1 && member.addressStreet1.trim() !== ''
  )
  
  return `
    <div class="info-window">
      <h3>${family.headOfHousehold}</h3>
      <p><strong>Address:</strong> ${memberWithAddress?.addressStreet1 || 'No address'}</p>
      <p><strong>Members:</strong> ${family.members.length}</p>
      <p><strong>Todos:</strong> ${family.todoItems.filter(item => !item.completed).length} pending</p>
      <p><strong>Review Day:</strong> ${family.reviewDay || 'Not set'}</p>
    </div>
  `
}

const clearMarkers = () => {
  markers.forEach(marker => marker.setMap(null))
  infoWindows.forEach(infoWindow => infoWindow.close())
  markers = []
  infoWindows = []
}

const fitMapToMarkers = () => {
  if (!map || markers.length === 0) return
  
  const bounds = new google.maps.LatLngBounds()
  markers.forEach(marker => {
    bounds.extend(marker.getPosition()!)
  })
  
  map.fitBounds(bounds)
  
  // If only one marker, zoom out a bit
  if (markers.length === 1) {
    map.setZoom(12)
  }
}

const updateSelectedFamilyMarker = () => {
  if (!map) return
  
  // Reset all markers to default style
  markers.forEach((marker, index) => {
    const family = props.families[index]
    if (family) {
      marker.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#3498db" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      })
    }
  })
  
  // Highlight selected family marker
  if (props.selectedFamily) {
    const selectedIndex = props.families.findIndex(f => f.id === props.selectedFamily?.id)
    if (selectedIndex !== -1 && markers[selectedIndex]) {
      markers[selectedIndex].setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#e74c3c" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12)
      })
      
      // Pan to selected marker
      map.panTo(markers[selectedIndex].getPosition()!)
    }
  }
}

// Watch for changes
watch(() => props.families, async () => {
  if (mapLoaded.value) {
    await addFamilyMarkers()
    fitMapToMarkers()
  }
}, { deep: true })

watch(() => props.selectedFamily, () => {
  if (mapLoaded.value) {
    updateSelectedFamilyMarker()
  }
})

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeMap()
})
</script>

<style scoped>
.google-map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.map-loading-overlay,
.map-error-overlay {
  position: absolute;
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

.error-content {
  text-align: center;
  padding: 2rem;
}

.error-content p {
  margin: 0 0 1rem 0;
  color: #e74c3c;
  font-weight: 500;
}

/* Info Window Styles */
:deep(.info-window) {
  padding: 0.5rem;
  max-width: 250px;
}

:deep(.info-window h3) {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

:deep(.info-window p) {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #7f8c8d;
}

:deep(.info-window strong) {
  color: #2c3e50;
}

/* Button Styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #6c757d;
  color: white;
}

.btn:hover {
  background: #5a6268;
}
</style> 
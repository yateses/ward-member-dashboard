declare global {
  interface Window {
    google: typeof google
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions)
      setCenter(latlng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
      panTo(latlng: LatLng | LatLngLiteral): void
      fitBounds(bounds: LatLngBounds): void
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(latlng: LatLng | LatLngLiteral): void
      setIcon(icon: string | Icon | Symbol): void
      getPosition(): LatLng
      addListener(eventName: string, handler: Function): MapsEventListener
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      open(map?: Map, anchor?: Marker): void
      close(): void
    }

    class Geocoder {
      constructor()
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void
    }

    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng)
      extend(point: LatLng): LatLngBounds
    }

    class Size {
      constructor(width: number, height: number)
    }

    class Point {
      constructor(x: number, y: number)
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      mapTypeId?: MapTypeId
      mapTypeControl?: boolean
      streetViewControl?: boolean
      fullscreenControl?: boolean
      zoomControl?: boolean
      styles?: MapTypeStyle[]
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map
      title?: string
      icon?: string | Icon | Symbol
    }

    interface InfoWindowOptions {
      content?: string | Element
      position?: LatLng | LatLngLiteral
    }

    interface GeocoderRequest {
      address?: string
      location?: LatLng | LatLngLiteral
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng
        viewport: LatLngBounds
      }
      formatted_address: string
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface Icon {
      url: string
      scaledSize?: Size
      anchor?: Point
    }

    interface Symbol {
      path: string
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
      scale?: number
    }

    interface MapTypeStyle {
      featureType?: string
      elementType?: string
      stylers?: any[]
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    interface MapsEventListener {
      remove(): void
    }
  }
}

export {} 
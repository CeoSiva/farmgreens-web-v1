"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const libraries: ("places" | "geometry" | "geocoding")[] = [
  "places",
  "geometry",
  "geocoding",
]

export interface GeocodedAddress {
  fullAddress: string
  pincode?: string
  area?: string
  city?: string
}

interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
  onAddressChange?: (address: GeocodedAddress | null) => void
  highlight?: boolean
}

const containerStyle = {
  width: "100%",
  height: "300px",
}

const DEFAULT_CENTER = {
  lat: 13.0827,
  lng: 80.2707,
}

export function MapPicker({
  initialLat,
  initialLng,
  onLocationChange,
  onAddressChange,
  highlight = false,
}: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  const geocodeLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!onAddressChange) return

      if (!geocoderRef.current && isLoaded) {
        geocoderRef.current = new google.maps.Geocoder()
      }

      if (!geocoderRef.current) return

      try {
        const results = await new Promise<google.maps.GeocoderResult | null>(
          (resolve) => {
            geocoderRef.current!.geocode(
              { location: { lat, lng } },
              (results) => resolve(results?.[0] || null)
            )
          }
        )

        if (results) {
          const addressComponents = results.address_components
          let pincode: string | undefined
          let area: string | undefined
          let city: string | undefined

          for (const component of addressComponents) {
            if (component.types.includes("postal_code")) {
              pincode = component.long_name
            }
            if (
              component.types.includes("sublocality") ||
              component.types.includes("neighborhood")
            ) {
              area = component.long_name
            }
            if (component.types.includes("locality")) {
              city = component.long_name
            }
          }

          onAddressChange({
            fullAddress: results.formatted_address,
            pincode,
            area,
            city,
          })
        } else {
          onAddressChange(null)
        }
      } catch (error) {
        console.error("Geocoding error:", error)
        onAddressChange(null)
      }
    },
    [isLoaded, onAddressChange]
  )

  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER
  )
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER
  )
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showOverlay, setShowOverlay] = useState(!initialLat || !initialLng)
  const mapRef = useRef<google.maps.Map | null>(null)

  // Update marker when initial props change
  useEffect(() => {
    if (initialLat && initialLng) {
      setCenter({ lat: initialLat, lng: initialLng })
      setMarkerPosition({ lat: initialLat, lng: initialLng })
    }
  }, [initialLat, initialLng])

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
  }

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) {
      setMarkerPosition({ lat, lng })
      onLocationChange(lat, lng)
      geocodeLocation(lat, lng)
    }
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) {
      setMarkerPosition({ lat, lng })
      onLocationChange(lat, lng)
      geocodeLocation(lat, lng)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newPosition = { lat: latitude, lng: longitude }
        setCenter(newPosition)
        setMarkerPosition(newPosition)
        onLocationChange(latitude, longitude)
        geocodeLocation(latitude, longitude)
        setIsLoadingLocation(false)
        setShowOverlay(false)

        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.panTo(newPosition)
          mapRef.current.setZoom(16)
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        let errorMessage = "Unable to retrieve your location. Please pin it manually on the map."
        
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable location access in your browser settings or pin your location manually on the map."
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again or pin your location manually on the map."
        }
        
        alert(errorMessage)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 300000,
      }
    )
  }

  if (loadError) {
    return (
      <Card className="p-4">
        <div className="text-sm text-destructive">
          Error loading maps. Please check your API key.
        </div>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Loading map...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">Pin your delivery location</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isLoadingLocation ? "Locating..." : "Use my location"}
        </Button>
      </div>
      <Card className={`overflow-hidden p-0 relative ${highlight ? "ring-2 ring-destructive" : ""}`}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker
            position={markerPosition}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        </GoogleMap>
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 p-6">
              <Button
                type="button"
                size="lg"
                onClick={handleGetCurrentLocation}
                disabled={isLoadingLocation}
                className="shadow-lg"
              >
                <Navigation className="h-5 w-5 mr-2" />
                {isLoadingLocation ? "Locating..." : "Use my location"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowOverlay(false)}
                className="text-white hover:text-white hover:bg-white/20"
              >
                Pin manually on map
              </Button>
            </div>
          </div>
        )}
      </Card>
      <div className="text-xs text-muted-foreground">
        Drag the marker or click on the map to set your delivery location.
      </div>
    </div>
  )
}

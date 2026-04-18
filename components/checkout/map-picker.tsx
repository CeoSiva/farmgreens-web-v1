"use client"

import { useEffect, useRef, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const libraries: ("places" | "geometry")[] = ["places", "geometry"]

interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
}

const containerStyle = {
  width: "100%",
  height: "300px",
}

const DEFAULT_CENTER = {
  lat: 13.0827,
  lng: 80.2707,
}

export function MapPicker({ initialLat, initialLng, onLocationChange }: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

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
    }
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) {
      setMarkerPosition({ lat, lng })
      onLocationChange(lat, lng)
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
        alert("Unable to retrieve your location. Please pin it manually on the map.")
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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
      <Card className="overflow-hidden p-0 relative">
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

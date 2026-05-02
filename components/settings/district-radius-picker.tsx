"use client"

import { useEffect, useRef, useState } from "react"
import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Target } from "lucide-react"

const libraries: ("places" | "geometry")[] = ["places", "geometry"]

const containerStyle = {
  width: "100%",
  height: "400px",
}

const DEFAULT_CENTER = {
  lat: 13.0827,
  lng: 80.2707,
}

interface DistrictRadiusPickerProps {
  initialCenter?: { lat: number; lng: number }
  initialRadius?: number
  onSave: (center: { lat: number; lng: number }, radius: number) => void
  isPending?: boolean
}

export function DistrictRadiusPicker({
  initialCenter,
  initialRadius = 4000,
  onSave,
  isPending = false,
}: DistrictRadiusPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    initialCenter || DEFAULT_CENTER
  )
  const [radius, setRadius] = useState<number>(initialRadius)
  const mapRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    if (initialCenter) {
      setCenter(initialCenter)
    }
    if (initialRadius) {
      setRadius(initialRadius)
    }
  }, [initialCenter, initialRadius])

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
  }

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat !== undefined && lng !== undefined) {
      setCenter({ lat, lng })
    }
  }

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setRadius(value * 1000) // Convert km to meters
    }
  }

  if (loadError) {
    return (
      <Card className="p-4 border-destructive bg-destructive/5">
        <div className="text-sm text-destructive">
          Error loading maps. Please check your API key.
        </div>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
          <Target className="h-4 w-4 animate-spin" />
          Loading map configuration...
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Delivery Boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Radius (km)</label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            className="h-8 w-20 text-xs"
            value={radius / 1000}
            onChange={handleRadiusChange}
            disabled={isPending}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-muted shadow-inner relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          onLoad={handleMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          <Marker
            position={center}
            draggable
            onDragEnd={handleMarkerDragEnd}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            }}
          />
          <Circle
            center={center}
            radius={radius}
            options={{
              fillColor: "#22c55e",
              fillOpacity: 0.1,
              strokeColor: "#22c55e",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false,
              editable: false,
              zIndex: 1,
            }}
          />
        </GoogleMap>
        
        <div className="absolute bottom-4 left-4 right-4 flex justify-end">
          <Button 
            size="sm" 
            onClick={() => onSave(center, radius)}
            disabled={isPending}
            className="shadow-lg"
          >
            Update Boundary
          </Button>
        </div>
      </Card>
      
      <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2 border border-primary/10">
        <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          Drag the <span className="font-semibold text-primary">green marker</span> to set the district center. 
          Use the input above to set the delivery radius in kilometers. 
          Customers outside this circle will be blocked from ordering.
        </p>
      </div>
    </div>
  )
}

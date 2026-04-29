"use client"

import * as React from "react"
import { NormalisedOrder } from "@/lib/utils/order-mapper"
import { clusterOrders, ClusteredOrder } from "@/lib/utils/geo-clustering"
import { ClusteredOrderType } from "./zone-results-panel"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, AlertCircle } from "lucide-react"

export interface ClusteringPanelProps {
  orders: NormalisedOrder[]
  onClusteringComplete: (clusteredOrders: ClusteredOrderType[]) => void
  isLoading?: boolean
}

export function ClusteringPanel({
  orders,
  onClusteringComplete,
  isLoading = false,
}: ClusteringPanelProps) {
  const [radius, setRadius] = React.useState(2)
  const [city, setCity] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("active")

  // Extract unique cities (districts)
  const uniqueCities = React.useMemo(() => {
    const cities = new Set<string>()
    orders.forEach((o) => {
      if (o.district) cities.add(o.district)
    })
    return Array.from(cities).sort()
  }, [orders])

  // Count valid vs invalid coords
  const { validCount, invalidCount } = React.useMemo(() => {
    let valid = 0
    let invalid = 0
    orders.forEach((o) => {
      if (!o.googleMapsLink || o.googleMapsLink === "no location") {
        invalid++
      } else {
        // Basic check for the presence of lat/lng in the URL
        if (o.googleMapsLink.match(/[?&]q=([\d.-]+),([\d.-]+)/)) {
          valid++
        } else {
          invalid++
        }
      }
    })
    return { validCount: valid, invalidCount: invalid }
  }, [orders])

  const handleRunClustering = () => {
    // 1. Filter by active status if requested
    let ordersToProcess = orders
    if (statusFilter === "active") {
      ordersToProcess = orders.filter((o) => {
        const status = (o.status || "").toLowerCase()
        return (
          status.includes("placed") ||
          status.includes("paid") ||
          status === "active" ||
          status === "pending" ||
          status === "confirmed"
        )
      })
    }

    // 2. Run clustering. 
    // The utility expects BaseOrder shapes and will filter by the selected city internally
    const results = clusterOrders(ordersToProcess, radius, city)

    // 3. Pass results to parent
    onClusteringComplete(results)
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <div>
        <h3 className="text-lg font-semibold leading-none tracking-tight">
          Delivery zone clustering
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Group orders by proximity before dispatching.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:items-end">
        {/* Radius Slider */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium leading-none">
              Cluster radius
            </label>
            <span className="text-sm text-muted-foreground font-medium">
              {radius.toFixed(1)} km
            </span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={(val) => setRadius(val[0])}
            min={0.5}
            max={20}
            step={0.5}
            className="cursor-pointer"
          />
        </div>

        {/* City Dropdown */}
        <div className="flex-1 space-y-3">
          <label className="text-sm font-medium leading-none">
            City / District
          </label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {uniqueCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Dropdown */}
        <div className="flex-1 space-y-3">
          <label className="text-sm font-medium leading-none">
            Order Status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active orders only</SelectItem>
              <SelectItem value="all">All orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2 border-t pt-5">
        {/* Summary counts */}
        <div className="flex items-center space-x-5 text-sm">
          <div className="flex items-center text-emerald-600 dark:text-emerald-500 font-medium">
            <MapPin className="mr-1.5 h-4 w-4" />
            <span>{validCount} valid GPS coordinates</span>
          </div>
          <div className="flex items-center text-amber-600 dark:text-amber-500 font-medium">
            <AlertCircle className="mr-1.5 h-4 w-4" />
            <span>{invalidCount} missing/invalid location</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleRunClustering}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Processing..." : "Run clustering"}
        </Button>
      </div>
    </div>
  )
}

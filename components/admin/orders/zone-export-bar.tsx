"use client"

import * as React from "react"
import { NormalisedOrder } from "@/lib/utils/order-mapper"
import { Coordinate } from "@/lib/utils/geo-clustering"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, Copy, CheckCircle2 } from "lucide-react"
import Papa from "papaparse"

export type ClusteredOrderWithZone = NormalisedOrder & {
  zoneLabel: string
  coords: Coordinate
}

export interface ZoneExportBarProps {
  clusteredOrders?: ClusteredOrderWithZone[]
}

export function ZoneExportBar({ clusteredOrders }: ZoneExportBarProps) {
  const [status, setStatus] = React.useState<string | null>(null)

  // Only render if we have clustered results
  if (!clusteredOrders || clusteredOrders.length === 0) {
    return null
  }

  const showStatus = (msg: string, duration = 3000) => {
    setStatus(msg)
    setTimeout(() => setStatus(null), duration)
  }

  const formatItems = (items: { product: string; qty: number }[]) => {
    return items.map((item) => `${item.product} x${item.qty}`).join("; ")
  }

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportWithZones = () => {
    const data = clusteredOrders.map((o) => ({
      Zone: o.zoneLabel,
      "Order Number": o.orderNumber,
      Date: o.date,
      "Customer Name": o.customerName,
      Mobile: o.mobileNumber,
      Address: o.address,
      Area: o.area,
      District: o.district,
      "Google Maps Link": o.googleMapsLink || "",
      Items: formatItems(o.items),
      "Total Value": o.totalValue,
    }))

    const csv = Papa.unparse(data)
    downloadBlob(csv, "all_zones_orders.csv")
    showStatus("Exported combined zones CSV")
  }

  const handleExportPerZone = async () => {
    const grouped = new Map<string, ClusteredOrderWithZone[]>()
    for (const order of clusteredOrders) {
      if (!grouped.has(order.zoneLabel)) {
        grouped.set(order.zoneLabel, [])
      }
      grouped.get(order.zoneLabel)!.push(order)
    }

    const zones = Array.from(grouped.keys()).sort()

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i]
      const orders = grouped.get(zone)!

      const data = orders.map((o) => ({
        "Order Number": o.orderNumber,
        Date: o.date,
        "Customer Name": o.customerName,
        Mobile: o.mobileNumber,
        Address: o.address,
        Area: o.area,
        District: o.district,
        "Google Maps Link": o.googleMapsLink || "",
        Items: formatItems(o.items),
        "Total Value": o.totalValue,
      }))

      const csv = Papa.unparse(data)
      const filename = `${zone.replace(/\s+/g, "_")}_orders.csv`
      downloadBlob(csv, filename)

      // Short delay between downloads to prevent browser blocking simultaneous downloads
      if (i < zones.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    
    showStatus(`Exported ${zones.length} zone files`)
  }

  const handleCopyLinks = async () => {
    const grouped = new Map<string, ClusteredOrderWithZone[]>()
    for (const order of clusteredOrders) {
      if (!grouped.has(order.zoneLabel)) {
        grouped.set(order.zoneLabel, [])
      }
      grouped.get(order.zoneLabel)!.push(order)
    }

    // Sort zones alphabetically, keeping Outlier at the end
    const zones = Array.from(grouped.keys()).sort((a, b) => {
      if (a === "Outlier") return 1
      if (b === "Outlier") return -1
      return a.localeCompare(b)
    })

    let text = ""
    for (const zone of zones) {
      text += `*${zone}*\n`
      const orders = grouped.get(zone)!
      
      for (const o of orders) {
        text += `${o.customerName}\n`
        text += `${o.address}\n`
        if (o.googleMapsLink && o.googleMapsLink !== "no location") {
          text += `${o.googleMapsLink}\n`
        } else {
          text += `No Location\n`
        }
        text += `\n` // Adds separation between orders, which naturally acts as separation between zones too
      }
    }

    try {
      await navigator.clipboard.writeText(text.trim())
      // Show short 2-second confirmation exactly as requested
      showStatus("Copied!", 2000)
    } catch (err) {
      showStatus("Failed to copy. Clipboard access denied.")
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <Button onClick={handleExportWithZones} variant="default" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export with zones
        </Button>
        <Button onClick={handleExportPerZone} variant="secondary" className="gap-2">
          <Download className="h-4 w-4" />
          One file per zone
        </Button>
        <Button onClick={handleCopyLinks} variant="outline" className="gap-2">
          <Copy className="h-4 w-4" />
          Copy map links
        </Button>
      </div>

      <div className="text-sm font-medium text-muted-foreground w-full sm:w-auto sm:text-right min-h-[20px]">
        {status && (
          <span className="flex items-center sm:justify-end gap-1.5 text-emerald-600 dark:text-emerald-500 animate-in fade-in slide-in-from-right-4 duration-300">
            <CheckCircle2 className="h-4 w-4" />
            {status}
          </span>
        )}
      </div>
    </div>
  )
}

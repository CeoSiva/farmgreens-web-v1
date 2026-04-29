"use client"

import * as React from "react"
import { NormalisedOrder } from "@/lib/utils/order-mapper"
import { Coordinate } from "@/lib/utils/geo-clustering"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Navigation,
  Package,
  Layers,
  IndianRupee,
  BarChart3,
} from "lucide-react"

export type ClusteredOrderType = NormalisedOrder & {
  zoneLabel: string
  coords: Coordinate
}

export interface ZoneResultsPanelProps {
  clusteredOrders?: ClusteredOrderType[]
}

const ZONE_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#84cc16", // Lime
]

function getZoneColor(label: string) {
  if (label === "Outlier") return "#9ca3af" // Neutral Grey
  const match = label.match(/Zone ([A-Z]+)/)
  if (!match) return "#9ca3af"
  const str = match[1]
  let idx = 0
  for (let i = 0; i < str.length; i++) {
    idx = idx * 26 + (str.charCodeAt(i) - 64)
  }
  return ZONE_COLORS[(idx - 1) % ZONE_COLORS.length]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ZoneResultsPanel({ clusteredOrders }: ZoneResultsPanelProps) {
  if (!clusteredOrders || clusteredOrders.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-muted/20">
        Run clustering above to see delivery zones.
      </div>
    )
  }

  // 1. Group by zoneLabel
  const grouped = React.useMemo(() => {
    const map = new Map<string, ClusteredOrderType[]>()
    for (const order of clusteredOrders) {
      if (!map.has(order.zoneLabel)) {
        map.set(order.zoneLabel, [])
      }
      map.get(order.zoneLabel)!.push(order)
    }

    // Sort zones alphabetically (A, B, C...) with Outlier at the end
    const sortedEntries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "Outlier") return 1
      if (b[0] === "Outlier") return -1
      return a[0].localeCompare(b[0])
    })

    return sortedEntries.map(([zoneLabel, orders]) => ({
      zoneLabel,
      orders,
      totalValue: orders.reduce((sum, o) => sum + o.totalValue, 0),
    }))
  }, [clusteredOrders])

  // Summary Metrics
  const totalOrders = clusteredOrders.length
  const totalZones = grouped.filter((g) => g.zoneLabel !== "Outlier").length
  const combinedValue = clusteredOrders.reduce(
    (sum, o) => sum + o.totalValue,
    0
  )
  const avgOrdersPerZone =
    totalZones > 0 ? (totalOrders / totalZones).toFixed(1) : "0"

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivery Zones
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalZones}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Combined Value
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(combinedValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Orders/Zone
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOrdersPerZone}</div>
          </CardContent>
        </Card>
      </div>

      {/* Accordion List */}
      <Accordion type="multiple" className="w-full space-y-4">
        {grouped.map((group) => {
          const color = getZoneColor(group.zoneLabel)

          // Construct Google Maps directions URL with up to 10 coords
          const routeCoords = group.orders
            .slice(0, 10)
            .map((o) => `${o.coords.lat},${o.coords.lng}`)
            .join("/")
          const mapsUrl = `https://www.google.com/maps/dir/${routeCoords}`

          return (
            <AccordionItem
              key={group.zoneLabel}
              value={group.zoneLabel}
              className="border rounded-xl bg-card px-2 sm:px-4 shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <AccordionTrigger className="hover:no-underline flex-1 pr-4 sm:pr-6 py-4">
                  <div className="flex items-center gap-3 sm:gap-4 text-base font-semibold">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span>{group.zoneLabel}</span>
                    <Badge
                      variant="secondary"
                      className="font-normal rounded-full shrink-0"
                    >
                      {group.orders.length} orders
                    </Badge>
                    <span className="text-muted-foreground font-normal ml-2 sm:ml-4 text-sm hidden sm:inline-block">
                      {formatCurrency(group.totalValue)}
                    </span>
                  </div>
                </AccordionTrigger>

                {/* Optional Directions Button (not for Outliers) */}
                {group.zoneLabel !== "Outlier" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8 gap-1.5 mr-2"
                    asChild
                  >
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline-block">Directions</span>
                    </a>
                  </Button>
                )}
              </div>

              <AccordionContent className="pt-2 pb-4">
                <div className="rounded-md border overflow-hidden sm:overflow-auto overflow-x-auto">
                  <Table className="min-w-[600px] sm:min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[100px]" scope="col">Order #</TableHead>
                        <TableHead scope="col">Customer</TableHead>
                        <TableHead scope="col">Address</TableHead>
                        <TableHead className="text-right" scope="col">Items</TableHead>
                        <TableHead className="text-right" scope="col">Value</TableHead>
                        <TableHead className="w-[60px]" scope="col"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.orders.map((order) => (
                        <TableRow key={order.orderNumber}>
                          <TableCell className="font-mono text-xs">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.customerName}
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate"
                            title={order.address}
                          >
                            {order.address}
                          </TableCell>
                          <TableCell className="text-right">
                            {order.items.length}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.totalValue)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={order.googleMapsLink || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in Maps"
                              >
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

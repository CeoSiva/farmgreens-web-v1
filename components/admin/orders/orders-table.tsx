"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  MoreHorizontal,
  Search,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  X,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrderDetailsDrawer } from "./order-details-drawer"
import {
  updateOrderStatusAction,
  bulkUpdateOrderStatusAction,
} from "@/server/actions/order-admin"
import { downloadCSV } from "@/lib/utils/export"
import { cn } from "@/lib/utils"
import { formatQuantity } from "@/lib/utils/format"

import { DatePickerWithRange } from "./date-range-picker"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"

import { ClusteringPanel } from "./clustering-panel"
import { ZoneResultsPanel } from "./zone-results-panel"
import { ZoneExportBar } from "./zone-export-bar"
import { normaliseOrders } from "@/lib/utils/order-mapper"
import { ClusteredOrder } from "@/lib/utils/geo-clustering"
import { ClusteredOrderType } from "./zone-results-panel"

export function OrdersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      items: false,
      doorStreet: false,
      createdAt: false,
      select: true,
    })
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [date, setDate] = React.useState<DateRange | undefined>(undefined)
  const [cityFilter, setCityFilter] = React.useState("all")
  const [areaFilter, setAreaFilter] = React.useState("all")
  const [valueBucketFilter, setValueBucketFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [isClusterPanelOpen, setIsClusterPanelOpen] = React.useState(false)
  const [clusteredOrders, setClusteredOrders] = React.useState<ClusteredOrderType[]>([])
  const [isWarningDismissed, setIsWarningDismissed] = React.useState(false)

  const normalisedRawOrders = React.useMemo(() => {
    return normaliseOrders(data)
  }, [data])

  const missingPinsCount = React.useMemo(() => {
    return normalisedRawOrders.filter((o) => {
      const status = (o.status || "").toLowerCase()
      const isActive =
        status.includes("placed") ||
        status.includes("paid") ||
        status === "active" ||
        status === "pending" ||
        status === "confirmed"
      const noLink = !o.googleMapsLink || o.googleMapsLink === "no location"
      return isActive && noLink
    }).length
  }, [normalisedRawOrders])

  // Filter data by date range
  const filteredData = React.useMemo(() => {
    if (!date?.from) return data

    const start = startOfDay(date.from)
    const end = date.to ? endOfDay(date.to) : endOfDay(date.from)

    return data.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return isWithinInterval(orderDate, { start, end })
    })
  }, [data, date])

  const normalizeLocation = (value: unknown) => {
    const text = String(value ?? "").trim()
    return text.length > 0 ? text : "Unknown"
  }

  const cityOptions = React.useMemo(() => {
    return Array.from(
      new Set(filteredData.map((order) => normalizeLocation(order.shippingAddress?.districtName)))
    ).sort((a, b) => a.localeCompare(b))
  }, [filteredData])

  const areaOptions = React.useMemo(() => {
    const source =
      cityFilter === "all"
        ? filteredData
        : filteredData.filter(
            (order) =>
              normalizeLocation(order.shippingAddress?.districtName) === cityFilter
          )
    return Array.from(
      new Set(source.map((order) => normalizeLocation(order.shippingAddress?.areaName)))
    ).sort((a, b) => a.localeCompare(b))
  }, [filteredData, cityFilter])

  const matchesValueBucket = (total: number, bucket: string) => {
    if (bucket === "lt250") return total < 250
    if (bucket === "250to500") return total >= 250 && total <= 500
    if (bucket === "500to1000") return total > 500 && total <= 1000
    if (bucket === "gt1000") return total > 1000
    return true
  }

  const categoryOptions = React.useMemo(() => {
    const categories = new Set<string>()
    filteredData.forEach((order) => {
      order.items?.forEach((item: any) => {
        if (item.productId?.category) {
          categories.add(item.productId.category)
        }
        if (item.selections) {
          item.selections.forEach((sel: any) => {
            if (sel.productId?.category) {
              categories.add(sel.productId.category)
            }
          })
        }
      })
    })
    return Array.from(categories).sort()
  }, [filteredData])

  const structuredFilteredData = React.useMemo(() => {
    return filteredData.filter((order) => {
      const orderCity = normalizeLocation(order.shippingAddress?.districtName)
      const orderArea = normalizeLocation(order.shippingAddress?.areaName)
      const total = Number(order.total ?? 0)

      const matchesCity = cityFilter === "all" || orderCity === cityFilter
      const matchesArea = areaFilter === "all" || orderArea === areaFilter
      const matchesValue = valueBucketFilter === "all" || matchesValueBucket(total, valueBucketFilter)
      
      let matchesCategory = categoryFilter === "all"
      if (!matchesCategory) {
        matchesCategory = order.items?.some((item: any) => {
          if (item.productId?.category === categoryFilter) return true
          if (item.selections) {
            return item.selections.some((sel: any) => sel.productId?.category === categoryFilter)
          }
          return false
        }) || false
      }

      return matchesCity && matchesArea && matchesValue && matchesCategory
    })
  }, [filteredData, cityFilter, areaFilter, valueBucketFilter, categoryFilter])

  const activeStructuredFiltersCount = [
    cityFilter !== "all",
    areaFilter !== "all",
    valueBucketFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderNumber",
      header: "Order #",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("orderNumber")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{order.customer.name}</span>
            <span className="text-xs text-muted-foreground">
              {order.customer.mobile}
            </span>
          </div>
        )
      },
    },
    {
      id: "items",
      header: "Items & Qty",
      cell: ({ row }) => {
        const items = row.original.items || []
        return (
          <div className="max-w-[150px] space-y-0.5">
            {items.map((it: any, i: number) => (
              <div
                key={i}
                className="flex justify-between gap-2 text-[11px] leading-tight"
              >
                <span className="truncate">{it.name}</span>
                <span className="font-bold whitespace-nowrap">
                  x{formatQuantity(it.qty, it.unit)}
                </span>
              </div>
            ))}
          </div>
        )
      },
      // Ensure visibility is reactive on various sizes
      enableHiding: true,
    },
    {
      id: "doorStreet",
      header: "Address",
      cell: ({ row }) => {
        const addr = row.original.shippingAddress
        return (
          <div className="max-w-[150px] truncate text-xs text-muted-foreground">
            {addr.door}, {addr.street}
          </div>
        )
      },
      enableHiding: true,
    },
    {
      accessorFn: (row) => row.shippingAddress?.areaName,
      id: "areaName",
      header: "Area",
      cell: ({ row }) => (
        <div className="max-w-[120px] truncate text-xs font-medium">
          {row.getValue("areaName")}
        </div>
      ),
    },
    {
      accessorFn: (row) => row.shippingAddress?.districtName,
      id: "districtName",
      header: "City",
      cell: ({ row }) => (
        <div className="max-w-[120px] truncate text-xs font-medium text-muted-foreground">
          {row.getValue("districtName")}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total"))
        return (
          <div className="text-right font-medium">₹{amount.toFixed(2)}</div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              status === "dispatched" &&
                "border-blue-200 bg-blue-50 text-blue-700",
              status === "delivered" &&
                "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        return (
          <div className="px-2 text-xs whitespace-nowrap text-muted-foreground">
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </div>
        )
      },
      enableHiding: true,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original

        const updateStatus = async (status: string) => {
          const res = await updateOrderStatusAction(order._id, status as any)
          if ((res as any).success)
            toast.success(`Order ${order.orderNumber} updated to ${status}`)
          else toast.error("Failed to update order")
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrder(order)
                  setIsDrawerOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => updateStatus("confirmed")}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> Confirm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("dispatched")}>
                <Truck className="mr-2 h-4 w-4 text-orange-500" /> Dispatch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("delivered")}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Deliver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("cancelled")}>
                <XCircle className="mr-2 h-4 w-4 text-destructive" /> Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: structuredFilteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = filterValue.toLowerCase()
      const order = row.original
      return (
        String(order.orderNumber ?? "").toLowerCase().includes(value) ||
        String(order.customer?.name ?? "").toLowerCase().includes(value) ||
        String(order.customer?.mobile ?? "").toLowerCase().includes(value) ||
        String(order.shippingAddress?.door ?? "").toLowerCase().includes(value) ||
        String(order.shippingAddress?.street ?? "").toLowerCase().includes(value) ||
        String(order.shippingAddress?.areaName ?? "").toLowerCase().includes(value) ||
        String(order.shippingAddress?.districtName ?? "").toLowerCase().includes(value)
      )
    },
  })

  const statusSummary = React.useMemo(() => {
    const summary = {
      placed: 0,
      confirmed: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0,
    }
    table.getFilteredRowModel().rows.forEach((row) => {
      const status = String(row.original.status ?? "")
      if (status in summary) {
        summary[status as keyof typeof summary] += 1
      }
    })
    return summary
  }, [table])

  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original._id)

  const handleBulkUpdate = async (status: string) => {
    const res = await bulkUpdateOrderStatusAction(selectedIds, status as any)
    if ((res as any).success) {
      toast.success(
        `Successfully updated ${selectedIds.length} orders to ${status}`
      )
      table.resetRowSelection()
    } else {
      toast.error("Failed to update orders")
    }
  }

  const formatExportAddress = (door?: string, street?: string) => {
    const apartmentPattern =
      /\b(apartment|apartments|apt|tower|block|residency|residence|phase|flat)\b/i
    const normalizedDoor = String(door ?? "").trim()
    const normalizedStreet = String(street ?? "").trim()
    const formattedStreet = apartmentPattern.test(normalizedStreet)
      ? normalizedStreet.toUpperCase()
      : normalizedStreet
    return `${normalizedDoor}, ${formattedStreet}`
  }

  const getGoogleMapsLink = (lat?: number, lng?: number): string => {
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      return `https://www.google.com/maps?q=${lat},${lng}`
    }
    return "no location"
  }

  const handleExport = (includeMobile: boolean) => {
    const rows = table.getFilteredRowModel().rows
    const ITEMS_PER_EXPORT_ROW = 5
    const exportData: Record<string, string | number>[] = []

    rows.forEach((r) => {
      const o = r.original
      let items = Array.isArray(o.items) ? o.items : []

      // Category filter isolation logic
      if (categoryFilter !== "all") {
        items = items.reduce((acc: any[], item: any) => {
          if (item.itemType === "combo") {
            const matchingSelections = item.selections?.filter(
              (sel: any) => sel.productId?.category === categoryFilter
            )
            if (matchingSelections && matchingSelections.length > 0) {
              matchingSelections.forEach((sel: any) => {
                acc.push({
                  itemType: "product",
                  name: `${sel.productName} (${item.comboName})`,
                  qty: sel.qty,
                  price: sel.unitPrice,
                  unit: "unit",
                })
              })
            }
          } else {
            if (item.productId?.category === categoryFilter) {
              acc.push(item)
            }
          }
          return acc
        }, [])
      }

      // Keep one row even when items are empty.
      const chunkCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_EXPORT_ROW))

      for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
        const chunkStart = chunkIndex * ITEMS_PER_EXPORT_ROW
        const chunk = items.slice(chunkStart, chunkStart + ITEMS_PER_EXPORT_ROW)

        // Fixed metadata columns (repeated on every chunk row).
        const rowData: Record<string, string | number> = {}

        if (clusteredOrders.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clusteredOrder = clusteredOrders.find((co: any) => co.orderNumber === o.orderNumber)
          rowData["Zone"] = clusteredOrder?.zoneLabel || "Outlier"
        }

        rowData["Date"] = new Date(o.createdAt).toLocaleString()
        rowData["Order Number"] = o.orderNumber
        rowData["Customer Name"] = o.customer.name

        if (includeMobile) {
          rowData["Mobile"] = o.customer.mobile
        }

        Object.assign(rowData, {
          Address: formatExportAddress(
            o.shippingAddress?.door,
            o.shippingAddress?.street
          ),
          Area: o.shippingAddress.areaName ?? "",
          District: o.shippingAddress.districtName ?? "",
          "Google Maps link": getGoogleMapsLink(
            o.shippingAddress?.lat,
            o.shippingAddress?.lng
          ),
        })

        // Fixed product columns (1..5) for every row.
        for (let i = 0; i < ITEMS_PER_EXPORT_ROW; i++) {
          const it = chunk[i]
          const n = i + 1

          if (it) {
            const isCombo = it.itemType === "combo"
            const itemName = isCombo ? it.comboName : it.name
            const itemQty = isCombo ? 1 : it.qty
            const itemUnit = isCombo ? "pkg" : it.unit

            const isWeight = itemUnit?.toLowerCase() === "kg"

            if (isWeight) {
              const multiplier = itemQty * 4
              rowData[`Product ${n}`] = `${itemName} - 250g`
              rowData[`Qty ${n}`] = multiplier
            } else {
              const unit = itemUnit?.toLowerCase()
              const shouldHideUnit = unit === "bunch" || unit === "batch" || unit === "pkg"
              rowData[`Product ${n}`] = itemName
              rowData[`Qty ${n}`] = shouldHideUnit ? itemQty : `${itemQty}${itemUnit || ""}`
            }

            rowData[`Price ${n}`] = (it.price * itemQty).toFixed(2)
          } else {
            rowData[`Product ${n}`] = ""
            rowData[`Qty ${n}`] = ""
            rowData[`Price ${n}`] = ""
          }
        }

        rowData["Status"] = o.status
        exportData.push(rowData)
      }
    })

    if (clusteredOrders.length > 0) {
      exportData.sort((a, b) => {
        const zoneA = String(a["Zone"] || "Outlier")
        const zoneB = String(b["Zone"] || "Outlier")
        if (zoneA === "Outlier") return 1
        if (zoneB === "Outlier") return -1
        return zoneA.localeCompare(zoneB)
      })
    }

    downloadCSV(
      exportData,
      `orders-export-${new Date().toISOString().split("T")[0]}.csv`
    )
  }

  const handleClearStructuredFilters = () => {
    setCityFilter("all")
    setAreaFilter("all")
    setValueBucketFilter("all")
    setCategoryFilter("all")
  }

  return (
    <div className="space-y-4">
      {!isWarningDismissed && missingPinsCount >= 3 && (
        <div className="flex animate-in fade-in slide-in-from-top-2 items-start gap-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {missingPinsCount} active orders are missing a delivery pin.
            </p>
            <p className="mt-1 opacity-90">
              These orders will be excluded from zone clustering.
            </p>
          </div>
          <button
            onClick={() => setIsWarningDismissed(true)}
            className="text-amber-600 hover:text-amber-900 transition-colors dark:text-amber-400 dark:hover:text-amber-300"
            aria-label="Dismiss warning"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Search & Date row */}
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, mobile, area..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-10 bg-card pl-9 lg:h-9"
            />
          </div>
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
        {/* Filters & Export row */}
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-10 flex-1 sm:flex-none lg:h-9 relative"
              >
                <Download className="mr-2 h-4 w-4" /> 
                {clusteredOrders.length > 0 ? "Export with zones" : "Export"}
                {clusteredOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport(false)}>
                Without Contact Numbers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(true)}>
                With Contact Numbers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={isClusterPanelOpen ? "default" : "outline"}
            size="lg"
            className="h-10 flex-1 sm:flex-none lg:h-9"
            onClick={() => setIsClusterPanelOpen(!isClusterPanelOpen)}
          >
            Zone clustering
          </Button>

          <Select
            onValueChange={(val) =>
              table
                .getColumn("status")
                ?.setFilterValue(val === "all" ? "" : val)
            }
          >
            <SelectTrigger className="h-10 w-full bg-card text-sm sm:w-[150px] lg:h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-10 w-full bg-card text-sm sm:w-[150px] lg:h-9">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cityOptions.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="h-10 w-full bg-card text-sm sm:w-[170px] lg:h-9">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areaOptions.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={valueBucketFilter} onValueChange={setValueBucketFilter}>
            <SelectTrigger className="h-10 w-full bg-card text-sm sm:w-[180px] lg:h-9">
              <SelectValue placeholder="All Order Values" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Order Values</SelectItem>
              <SelectItem value="lt250">&lt; 250</SelectItem>
              <SelectItem value="250to500">250 - 500</SelectItem>
              <SelectItem value="500to1000">500 - 1000</SelectItem>
              <SelectItem value="gt1000">&gt; 1000</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-full bg-card text-sm sm:w-[150px] lg:h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary">Filters: {activeStructuredFiltersCount}</Badge>
          <Badge variant="outline">Results: {table.getFilteredRowModel().rows.length}</Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={handleClearStructuredFilters}
            disabled={activeStructuredFiltersCount === 0}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {isClusterPanelOpen && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <ClusteringPanel 
            orders={normalisedRawOrders} 
            onClusteringComplete={setClusteredOrders} 
          />
          {clusteredOrders.length > 0 && (
            <>
              <ZoneResultsPanel clusteredOrders={clusteredOrders} />
              <ZoneExportBar clusteredOrders={clusteredOrders} />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <div className="rounded-md border bg-card p-3 text-xs">
          <p className="text-muted-foreground">Placed</p>
          <p className="text-lg font-semibold">{statusSummary.placed}</p>
        </div>
        <div className="rounded-md border bg-card p-3 text-xs">
          <p className="text-muted-foreground">Confirmed</p>
          <p className="text-lg font-semibold">{statusSummary.confirmed}</p>
        </div>
        <div className="rounded-md border bg-card p-3 text-xs">
          <p className="text-muted-foreground">Dispatched</p>
          <p className="text-lg font-semibold">{statusSummary.dispatched}</p>
        </div>
        <div className="rounded-md border bg-card p-3 text-xs">
          <p className="text-muted-foreground">Delivered</p>
          <p className="text-lg font-semibold">{statusSummary.delivered}</p>
        </div>
        <div className="rounded-md border bg-card p-3 text-xs">
          <p className="text-muted-foreground">Cancelled</p>
          <p className="text-lg font-semibold">{statusSummary.cancelled}</p>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex animate-in flex-col items-start gap-4 rounded-xl border border-primary/10 bg-primary/5 p-4 fade-in slide-in-from-top-2 sm:flex-row sm:items-center">
          <span className="text-sm font-bold whitespace-nowrap text-primary">
            {selectedIds.length} orders selected
          </span>
          <div className="hidden h-4 w-px bg-primary/20 sm:block" />
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="mr-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Bulk:
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs font-bold hover:bg-blue-100 hover:text-blue-700"
              onClick={() => handleBulkUpdate("confirmed")}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs font-bold hover:bg-orange-100 hover:text-orange-700"
              onClick={() => handleBulkUpdate("dispatched")}
            >
              Dispatch
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs font-bold hover:bg-green-100 hover:text-green-700"
              onClick={() => handleBulkUpdate("delivered")}
            >
              Deliver
            </Button>
          </div>
        </div>
      )}

      <div className="no-scrollbar overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedOrder(row.original)
                    setIsDrawerOpen(true)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        // Prevent drawer opening when clicking actions or checkboxes
                        if (
                          cell.column.id === "actions" ||
                          cell.column.id === "select"
                        ) {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}

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
    data: filteredData,
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
        order.orderNumber.toLowerCase().includes(value) ||
        order.customer.name.toLowerCase().includes(value) ||
        order.customer.mobile.toLowerCase().includes(value) ||
        order.shippingAddress.door.toLowerCase().includes(value) ||
        order.shippingAddress.street.toLowerCase().includes(value) ||
        order.shippingAddress.areaName.toLowerCase().includes(value) ||
        order.shippingAddress.districtName.toLowerCase().includes(value)
      )
    },
  })

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

  const handleExport = (includeMobile: boolean) => {
    const rows = table.getFilteredRowModel().rows

    // Find the maximum number of items across all orders (sets column count)
    const maxItems = rows.reduce(
      (max, r) => Math.max(max, r.original.items?.length ?? 0),
      0
    )

    const exportData = rows.map((r) => {
      const o = r.original
      const items: any[] = o.items || []

      // Fixed leading columns
      const rowData: Record<string, string | number> = {
        Date: new Date(o.createdAt).toLocaleString(),
        "Order Number": o.orderNumber,
        "Customer Name": o.customer.name,
      }
      if (includeMobile) {
        rowData["Mobile"] = o.customer.mobile
      }
      Object.assign(rowData, {
        Address: `${o.shippingAddress.door}, ${o.shippingAddress.street}`,
        Area: o.shippingAddress.areaName ?? "",
        District: o.shippingAddress.districtName ?? "",
      })

      // Dynamic product columns — one group per slot, using numbered keys to avoid overwrites
      for (let i = 0; i < maxItems; i++) {
        const it = items[i]
        const n = i + 1
        if (it) {
          const isWeight = it.unit?.toLowerCase() === "kg"
          const unitLabel = isWeight ? "g" : it.unit
          const qtyVal = isWeight ? it.qty * 1000 : it.qty

          rowData[`Product ${n}`] = it.name
          rowData[`Qty ${n}`] = `${qtyVal}${unitLabel}`
          rowData[`Price ${n}`] = (it.price * it.qty).toFixed(2)
        } else {
          rowData[`Product ${n}`] = ""
          rowData[`Qty ${n}`] = ""
          rowData[`Price ${n}`] = ""
        }
      }

      // Fixed trailing column
      rowData["Status"] = o.status

      return rowData
    })

    downloadCSV(
      exportData,
      `orders-export-${new Date().toISOString().split("T")[0]}.csv`
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-row">
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
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-10 flex-1 sm:flex-none lg:h-9"
              >
                <Download className="mr-2 h-4 w-4" /> Export
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

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

import { DatePickerWithRange } from "./date-range-picker"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { DateRange } from "react-day-picker"

export function OrdersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    items: false,
    address: false,
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      cell: ({ row }) => <div className="font-medium">{row.getValue("orderNumber")}</div>,
    },
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{order.customer.name}</span>
            <span className="text-xs text-muted-foreground">{order.customer.mobile}</span>
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
              <div key={i} className="text-[11px] leading-tight flex justify-between gap-2">
                <span className="truncate">{it.name}</span>
                <span className="font-bold whitespace-nowrap">x{it.qty}</span>
              </div>
            ))}
          </div>
        )
      },
      // Ensure visibility is reactive on various sizes
      enableHiding: true,
    },
    {
      id: "address",
      header: "Area / District",
      cell: ({ row }) => {
        const addr = row.original.shippingAddress
        return (
          <div className="max-w-[150px] truncate text-xs text-muted-foreground">
            {addr.areaName}, {addr.districtName}
          </div>
        )
      },
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total"))
        return <div className="text-right font-medium">₹{amount.toFixed(2)}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={cn("capitalize", 
            status === 'dispatched' && "bg-blue-50 text-blue-700 border-blue-200",
            status === 'delivered' && "bg-emerald-50 text-emerald-700 border-emerald-200"
          )}>
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
          <div className="text-xs text-muted-foreground whitespace-nowrap px-2">
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
          if ((res as any).success) toast.success(`Order ${order.orderNumber} updated to ${status}`)
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
              <DropdownMenuItem onClick={() => {
                setSelectedOrder(order)
                setIsDrawerOpen(true)
              }}>
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
        order.shippingAddress.areaName.toLowerCase().includes(value) ||
        order.shippingAddress.districtName.toLowerCase().includes(value)
      )
    }
  })

  const selectedIds = table.getFilteredSelectedRowModel().rows.map(r => r.original._id)

  const handleBulkUpdate = async (status: string) => {
    const res = await bulkUpdateOrderStatusAction(selectedIds, status as any)
    if ((res as any).success) {
      toast.success(`Successfully updated ${selectedIds.length} orders to ${status}`)
      table.resetRowSelection()
    } else {
      toast.error("Failed to update orders")
    }
  }

  const handleExport = () => {
    const exportData = table.getFilteredRowModel().rows.map(r => {
      const o = r.original
      return {
        "Date": new Date(o.createdAt).toLocaleString(),
        "Order Number": o.orderNumber,
        "Customer Name": o.customer.name,
        "Mobile": o.customer.mobile,
        "Address": `${o.shippingAddress.door}, ${o.shippingAddress.street}`,
        "Area": o.shippingAddress.areaName,
        "District": o.shippingAddress.districtName,
        "Items": o.items.map((it: any) => `${it.name} (${it.qty} ${it.unit})`).join(", "),
        "Total": o.total,
        "Status": o.status,
      }
    })
    downloadCSV(exportData, `orders-export-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, mobile, area..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 h-10 lg:h-9 bg-card"
            />
          </div>
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-10 lg:h-9 flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Select 
            onValueChange={(val) => table.getColumn("status")?.setFilterValue(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-10 lg:h-9 text-sm bg-card">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl bg-primary/5 p-4 border border-primary/10 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-bold text-primary whitespace-nowrap">
            {selectedIds.length} orders selected
          </span>
          <div className="hidden sm:block h-4 w-px bg-primary/20" />
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">Bulk:</span>
            <Button size="sm" variant="secondary" className="h-7 text-xs font-bold hover:bg-blue-100 hover:text-blue-700" onClick={() => handleBulkUpdate("confirmed")}>
              Confirm
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs font-bold hover:bg-orange-100 hover:text-orange-700" onClick={() => handleBulkUpdate("dispatched")}>
              Dispatch
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs font-bold hover:bg-green-100 hover:text-green-700" onClick={() => handleBulkUpdate("delivered")}>
              Deliver
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-card overflow-x-auto no-scrollbar">
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
                    <TableCell key={cell.id} onClick={(e) => {
                      // Prevent drawer opening when clicking actions or checkboxes
                      if (cell.column.id === "actions" || cell.column.id === "select") {
                        e.stopPropagation()
                      }
                    }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
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

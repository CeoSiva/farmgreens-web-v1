"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Search, Eye, User, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CustomerDetailsDrawer } from "./customer-details-drawer"

type OrderFilterValue = "all" | "no-orders" | "has-orders"
type WhatsAppFilterValue = "all" | "opted-in" | "opted-out"
type CustomerRow = {
  _id: string
  name: string
  mobile: string
  addresses?: Array<{ isDefault?: boolean; door?: string; street?: string }>
  orderCount?: number
  areaName?: string | null
  districtName?: string | null
  updatedAt?: string
  whatsappOptIn?: boolean
}

export function CustomersTable({ data }: { data: CustomerRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [cityFilter, setCityFilter] = React.useState("all")
  const [areaFilter, setAreaFilter] = React.useState("all")
  const [orderFilter, setOrderFilter] = React.useState<OrderFilterValue>("all")
  const [whatsAppFilter, setWhatsAppFilter] =
    React.useState<WhatsAppFilterValue>("all")
  const [activityFrom, setActivityFrom] = React.useState("")
  const [activityTo, setActivityTo] = React.useState("")
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerRow | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const normalizedData = React.useMemo<CustomerRow[]>(
    () =>
      data.map((customer) => ({
        ...customer,
        districtName:
          typeof customer.districtName === "string" && customer.districtName.trim()
            ? customer.districtName
            : "Unknown",
        areaName:
          typeof customer.areaName === "string" && customer.areaName.trim()
            ? customer.areaName
            : "Unknown",
        orderCount: Number(customer.orderCount ?? 0),
        whatsappOptIn: Boolean(customer.whatsappOptIn),
      })),
    [data]
  )

  const cityOptions = React.useMemo(
    () =>
      Array.from(new Set(normalizedData.map((row) => row.districtName ?? "Unknown"))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [normalizedData]
  )
  const areaOptions = React.useMemo(
    () =>
      Array.from(new Set(normalizedData.map((row) => row.areaName ?? "Unknown"))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [normalizedData]
  )

  const inDateRange = (dateString: string, from: string, to: string) => {
    const value = new Date(dateString)
    if (Number.isNaN(value.getTime())) return false
    if (from) {
      const fromDate = new Date(`${from}T00:00:00`)
      if (value < fromDate) return false
    }
    if (to) {
      const toDate = new Date(`${to}T23:59:59.999`)
      if (value > toDate) return false
    }
    return true
  }

  const orderActivityFilterFn: FilterFn<CustomerRow> = (row, columnId, filterValue) => {
    const count = Number(row.getValue(columnId) ?? 0)
    if (filterValue === "no-orders") return count === 0
    if (filterValue === "has-orders") return count > 0
    return true
  }

  const boolFilterFn: FilterFn<CustomerRow> = (row, columnId, filterValue) => {
    if (filterValue === "all") return true
    const value = Boolean(row.getValue(columnId))
    return filterValue === "opted-in" ? value : !value
  }

  const activityRangeFilterFn: FilterFn<CustomerRow> = (row, columnId, filterValue) => {
    if (!filterValue?.from && !filterValue?.to) return true
    const updatedAt = String(row.getValue(columnId) ?? "")
    return inDateRange(updatedAt, filterValue.from, filterValue.to)
  }

  const columns: ColumnDef<CustomerRow>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold leading-none">{customer.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{customer.mobile}</span>
                {customer.whatsappOptIn && (
                  <Badge
                    variant="outline"
                    className="h-4 border-green-500/20 bg-green-500/10 px-1.5 text-[9px] font-medium text-green-600"
                  >
                    WhatsApp
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: "address",
      header: "Address",
      cell: ({ row }) => {
        const addresses = row.original.addresses || []
        const primary = addresses.find((a) => a.isDefault) || addresses[0]
        if (!primary) {
          return <span className="text-xs italic text-muted-foreground">No address</span>
        }
        return (
          <div className="max-w-[150px] truncate text-xs text-muted-foreground">
            {primary.door}, {primary.street}
          </div>
        )
      },
    },
    {
      accessorKey: "areaName",
      header: "Area",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("areaName") || "Unknown"}</span>
      ),
    },
    {
      accessorKey: "districtName",
      header: "City",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("districtName") || "Unknown"}</span>
      ),
    },
    {
      accessorKey: "orderCount",
      header: () => <div className="text-center">Orders</div>,
      filterFn: orderActivityFilterFn,
      cell: ({ row }) => {
        const count = row.getValue("orderCount") as number
        return (
          <div className="text-center">
            <Badge variant={count > 0 ? "secondary" : "outline"} className="font-bold">
              {count}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Last Activity",
      filterFn: activityRangeFilterFn,
      cell: ({ row }) => {
        const raw = row.getValue("updatedAt")
        const date = raw ? new Date(String(raw)) : null
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "whatsappOptIn",
      header: "WhatsApp",
      filterFn: boolFilterFn,
      cell: ({ row }) =>
        row.original.whatsappOptIn ? (
          <Badge
            variant="outline"
            className="h-4 border-green-500/20 bg-green-500/10 px-1.5 text-[9px] font-medium text-green-600"
          >
            Opted In
          </Badge>
        ) : (
          <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
            Opted Out
          </Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCustomer(customer)
                  setIsDrawerOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> View/Edit Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: normalizedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  React.useEffect(() => {
    table.getColumn("districtName")?.setFilterValue(cityFilter === "all" ? undefined : cityFilter)
  }, [cityFilter, table])

  React.useEffect(() => {
    table.getColumn("areaName")?.setFilterValue(areaFilter === "all" ? undefined : areaFilter)
  }, [areaFilter, table])

  React.useEffect(() => {
    table.getColumn("orderCount")?.setFilterValue(orderFilter === "all" ? undefined : orderFilter)
  }, [orderFilter, table])

  React.useEffect(() => {
    table
      .getColumn("whatsappOptIn")
      ?.setFilterValue(whatsAppFilter === "all" ? undefined : whatsAppFilter)
  }, [whatsAppFilter, table])

  React.useEffect(() => {
    table.getColumn("updatedAt")?.setFilterValue(
      activityFrom || activityTo ? { from: activityFrom, to: activityTo } : undefined
    )
  }, [activityFrom, activityTo, table])

  const activeFiltersCount = [
    cityFilter !== "all",
    areaFilter !== "all",
    orderFilter !== "all",
    whatsAppFilter !== "all",
    Boolean(activityFrom),
    Boolean(activityTo),
  ].filter(Boolean).length

  const resetFilters = () => {
    setCityFilter("all")
    setAreaFilter("all")
    setOrderFilter("all")
    setWhatsAppFilter("all")
    setActivityFrom("")
    setActivityTo("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge variant="secondary">Filters: {activeFiltersCount}</Badge>
            <Badge variant="outline">Results: {table.getFilteredRowModel().rows.length}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={activeFiltersCount === 0}
            >
              Clear filters
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cityOptions.map((city) => (
                <SelectItem key={city} value={city}>
                  {city === "Unknown" ? "Unknown city" : city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {areaOptions.map((area) => (
                <SelectItem key={area} value={area}>
                  {area === "Unknown" ? "Unknown area" : area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={orderFilter} onValueChange={(v) => setOrderFilter(v as OrderFilterValue)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="has-orders">Has orders</SelectItem>
              <SelectItem value="no-orders">No orders</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={whatsAppFilter}
            onValueChange={(v) => setWhatsAppFilter(v as WhatsAppFilterValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="WhatsApp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All WhatsApp states</SelectItem>
              <SelectItem value="opted-in">Opted in</SelectItem>
              <SelectItem value="opted-out">Opted out</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={activityFrom}
            onChange={(e) => setActivityFrom(e.target.value)}
            className="w-full"
            aria-label="Last activity from date"
          />
          <Input
            type="date"
            value={activityTo}
            onChange={(e) => setActivityTo(e.target.value)}
            className="w-full"
            aria-label="Last activity to date"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedCustomer(row.original)
                    setIsDrawerOpen(true)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === "actions") e.stopPropagation()
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {activeFiltersCount > 0 || globalFilter.trim().length > 0
                    ? "No customers match the active filters."
                    : "No customers found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
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

      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}

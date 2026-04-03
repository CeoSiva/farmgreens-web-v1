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
  Eye,
  User,
  ShoppingBag,
  MapPin,
  Calendar
} from "lucide-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CustomerDetailsDrawer } from "./customer-details-drawer"

export function CustomersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedCustomer, setSelectedCustomer] = React.useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold leading-none">{customer.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{customer.mobile}</span>
                {customer.whatsappOptIn && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/20 font-medium">
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
        const primary = addresses.find((a: any) => a.isDefault) || addresses[0]
        if (!primary) return <span className="text-xs text-muted-foreground italic">No address</span>
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
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("areaName") || "-"}</span>
      ),
    },
    {
      accessorKey: "districtName",
      header: "City",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.getValue("districtName") || "-"}</span>
      ),
    },
    {
      accessorKey: "orderCount",
      header: ({ column }) => (
        <div className="text-center">Orders</div>
      ),
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
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3 w-3" />
            {new Date(row.getValue("updatedAt")).toLocaleDateString()}
          </div>
        )
      },
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
              <DropdownMenuItem onClick={() => {
                setSelectedCustomer(customer)
                setIsDrawerOpen(true)
              }}>
                <Eye className="mr-2 h-4 w-4" /> View/Edit Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedCustomer(row.original)
                    setIsDrawerOpen(true)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={(e) => {
                      if (cell.column.id === "actions") {
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
                  No customers found.
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

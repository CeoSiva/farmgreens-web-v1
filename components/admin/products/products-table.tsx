"use client"

import { useState, useTransition, useMemo } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  EditProductButton,
  DeleteProductButton,
} from "@/components/product-actions"
import { InlineImageUpload } from "@/components/inline-image-upload"
import {
  bulkUpdateProductStatusAction,
  updateProductVisibilityAction,
} from "@/server/actions/product"

export function ProductsTable({
  products,
  districts,
}: {
  products: any[]
  districts: any[]
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false
      }
      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  const hasActiveFilters =
    searchQuery || categoryFilter !== "all" || statusFilter !== "all"

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map((p) => p._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  const handleBulkStatus = (status: "active" | "draft" | "archived") => {
    if (selectedIds.length === 0) return

    startTransition(async () => {
      const res = await bulkUpdateProductStatusAction(selectedIds, status)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Updated ${selectedIds.length} products to ${status}`)
        setSelectedIds([])
      }
    })
  }

  const allSelected =
    filteredProducts.length > 0 &&
    selectedIds.length === filteredProducts.length
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < filteredProducts.length

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/60 p-3 text-sm">
          <span className="mr-2 font-medium">
            {selectedIds.length} product{selectedIds.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatus("active")}
            disabled={isPending}
          >
            Set Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatus("draft")}
            disabled={isPending}
          >
            Set Draft
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatus("archived")}
            disabled={isPending}
          >
            Set Archived
          </Button>
          {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-card pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-full bg-card text-sm sm:w-[170px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="vegetable">Vegetables</SelectItem>
            <SelectItem value="greens">Fresh Greens</SelectItem>
            <SelectItem value="batter">Idli/Dosa Batter</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full bg-card text-sm sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("all")
              setStatusFilter("all")
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="no-scrollbar overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">
                Order Setup
              </TableHead>
              <TableHead className="hidden text-center sm:table-cell">
                Status
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {hasActiveFilters
                    ? "No products match your filters."
                    : "No products found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow
                  key={product._id}
                  data-state={selectedIds.includes(product._id) && "selected"}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.includes(product._id)}
                      onCheckedChange={(c) => handleSelect(!!c, product._id)}
                    />
                  </TableCell>
                  <TableCell>
                    {product.imageUrl ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        <InlineImageUpload productId={product._id} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-[10px] tracking-wider text-muted-foreground uppercase lg:hidden">
                        {product.category}
                      </span>
                    </div>
                    {product.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden capitalize lg:table-cell">
                    {product.category}
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">
                    ₹{product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px] capitalize"
                      >
                        {product.orderQuantity.type}
                      </Badge>
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        ({product.orderQuantity.unit})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-center sm:table-cell">
                    <Badge
                      variant={
                        product.status === "active"
                          ? "default"
                          : product.status === "draft"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <EditProductButton
                        product={product}
                        districts={districts}
                      />
                      <DeleteProductButton
                        id={product._id}
                        name={product.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

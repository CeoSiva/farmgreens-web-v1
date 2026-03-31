"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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

import {
  EditProductButton,
  DeleteProductButton,
} from "@/components/product-actions"
import { InlineImageUpload } from "@/components/inline-image-upload"
import { bulkUpdateProductStatusAction, updateProductVisibilityAction } from "@/server/actions/product"

export function ProductsTable({
  products,
  districts,
}: {
  products: any[]
  districts: any[]
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p) => p._id))
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

  const handleVisibilityToggle = (id: string, currentVal: boolean) => {
    startTransition(async () => {
      const res = await updateProductVisibilityAction(id, !currentVal)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Home page visibility ${!currentVal ? "enabled" : "disabled"}!`)
      }
    })
  }

  const allSelected =
    products.length > 0 && selectedIds.length === products.length
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < products.length

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/60 rounded-md border text-sm">
          <span className="font-medium mr-2">
            {selectedIds.length} product{selectedIds.length > 1 ? "s" : ""} selected
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

      <div className="rounded-md border overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Order Setup</TableHead>
              <TableHead className="w-[80px] text-center">Home</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id} data-state={selectedIds.includes(product._id) && "selected"}>
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
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground lg:hidden">
                        {product.category}
                      </span>
                    </div>
                    {product.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell capitalize">
                    {product.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">
                    ₹{product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="capitalize text-[10px] px-1.5 py-0 h-5"
                      >
                        {product.orderQuantity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({product.orderQuantity.unit})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                       <Checkbox 
                         checked={product.showOnHomePage !== false}
                         onCheckedChange={() => handleVisibilityToggle(product._id, product.showOnHomePage !== false)}
                         disabled={isPending}
                       />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
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

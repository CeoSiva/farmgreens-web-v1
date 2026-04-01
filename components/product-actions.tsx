"use client"

import { useState, useTransition } from "react"
import {
  PlusIcon,
  EditIcon,
  Trash2Icon,
  UploadIcon,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ProductForm } from "@/components/product-form"
import { ProductSchema, ProductFormValues } from "@/lib/schemas/product"
import {
  deleteProductAction,
  createProductAction,
  bulkUpdateProductAvailabilityAction,
} from "@/server/actions/product"
import { toast } from "sonner"
import Papa from "papaparse"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function AddProductButton({ districts }: { districts: any[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="mb-2">
          <SheetTitle>Add New Product</SheetTitle>
          <SheetDescription>
            Create a new product by filling out the details below.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ProductForm districts={districts} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function EditProductButton({
  product,
  districts,
}: {
  product: ProductFormValues & { _id: string }
  districts: any[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <EditIcon className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Edit</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="mb-2">
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Update the details for {product.name}.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ProductForm
            districts={districts}
            initialData={product}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function DeleteProductButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteProductAction(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Deleted ${name} successfully!`)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2Icon className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            product
            <span className="font-semibold text-foreground"> {name}</span> from
            our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function BulkUploadProductsButton() {
  const [isPending, startTransition] = useTransition()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(() => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        complete: async function (results: any) {
          try {
            let successCount = 0
            let errorCount = 0
            const validCategories = ["vegetable", "batter", "greens"] as const
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const row of results.data as any[]) {
              const payload = {
                name: row.name || "Untitled",
                category: validCategories.includes(row.category)
                  ? row.category
                  : undefined,
                description: row.description || "",
                price: parseFloat(row.price) || 0,
                status: row.status || "active",
                orderQuantity: {
                  type: row.type === "count" ? "count" : "weight",
                  unit: row.unit || "kg",
                },
                imageUrl: "",
              }
              const parsed = ProductSchema.safeParse(payload)
              if (!parsed.success) {
                errorCount++
                continue
              }
              const res = await createProductAction(parsed.data)
              if (res.error) errorCount++
              else successCount++
            }
            toast.success(
              `Bulk imported! Success: ${successCount}, Failures: ${errorCount}`
            )
          } catch (err) {
            toast.error("Failed to parse and upload CSV.")
          }
        },
      })
    })
  }

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        id="csv-upload"
        className="hidden"
        onChange={handleFileUpload}
        disabled={isPending}
      />
      <label htmlFor="csv-upload">
        <Button variant="outline" asChild disabled={isPending}>
          <span>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadIcon className="mr-2 h-4 w-4" />
            )}
            Bulk CSV Upload
          </span>
        </Button>
      </label>
    </div>
  )
}

export function BulkAvailabilityButton({
  selectedIds,
  districts,
  onDone,
}: {
  selectedIds: string[]
  districts: any[]
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [availableInAll, setAvailableInAll] = useState(true)
  const [unavailableSet, setUnavailableSet] = useState<Set<string>>(new Set())

  const handleApply = () => {
    startTransition(async () => {
      const res = await bulkUpdateProductAvailabilityAction(
        selectedIds,
        availableInAll ? [] : Array.from(unavailableSet)
      )
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(
          `Updated availability for ${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""}`
        )
        setOpen(false)
        setAvailableInAll(true)
        setUnavailableSet(new Set())
        onDone()
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
          Bulk Availability
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-4">
          <SheetTitle>Bulk Update District Availability</SheetTitle>
          <SheetDescription>
            Apply district availability to {selectedIds.length} selected product
            {selectedIds.length > 1 ? "s" : ""}.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-center space-x-2 rounded-lg border bg-card p-4">
            <Checkbox
              id="bulk-avail-all"
              checked={availableInAll}
              onCheckedChange={(checked) => {
                setAvailableInAll(!!checked)
                if (checked) setUnavailableSet(new Set())
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="bulk-avail-all"
                className="cursor-pointer text-sm leading-none font-medium"
              >
                Available in all districts
              </Label>
              <p className="text-xs text-muted-foreground">
                Products will be visible on all district routes.
              </p>
            </div>
          </div>
          {!availableInAll && (
            <div className="grid grid-cols-2 gap-3">
              {districts.map((district: any) => {
                const isUnavailable = unavailableSet.has(district._id)
                return (
                  <div
                    key={district._id}
                    className="flex items-center space-x-2 rounded-lg border bg-card p-3"
                  >
                    <Checkbox
                      id={`bulk-avail-${district._id}`}
                      checked={!isUnavailable}
                      onCheckedChange={(checked) => {
                        const next = new Set(unavailableSet)
                        if (checked) {
                          next.delete(district._id)
                        } else {
                          next.add(district._id)
                        }
                        setUnavailableSet(next)
                      }}
                    />
                    <Label
                      htmlFor={`bulk-avail-${district._id}`}
                      className="cursor-pointer text-sm leading-none"
                    >
                      {district.name}
                    </Label>
                  </div>
                )
              })}
            </div>
          )}
          <Button className="w-full" onClick={handleApply} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply to {selectedIds.length} product
            {selectedIds.length > 1 ? "s" : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

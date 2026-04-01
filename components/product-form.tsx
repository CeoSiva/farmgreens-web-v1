"use client"

import { useTransition, useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ProductSchema, ProductFormValues } from "@/lib/schemas/product"
import {
  createProductAction,
  updateProductAction,
} from "@/server/actions/product"
import { ImageUpload } from "@/components/image-upload"

interface ProductFormProps {
  initialData?: ProductFormValues & { _id: string }
  districts?: any[]
  onSuccess?: () => void
}

export function ProductForm({
  initialData,
  districts = [],
  onSuccess,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition()

  // Helper to prefill custom pricing for all districts
  const defaultCustomPricing = districts.map((d: any) => {
    const existing = initialData?.customPricing?.find(
      (cp) => cp.districtId === d._id
    )
    return {
      districtId: d._id,
      price: existing ? existing.price : initialData?.price || 0,
    }
  })

  const defaultAvailableInAll = initialData?.availableInAllDistricts ?? true
  const defaultUnavailableSet = new Set(initialData?.unavailableDistricts || [])

  const [availableInAll, setAvailableInAll] = useState(defaultAvailableInAll)
  const [unavailableSet, setUnavailableSet] = useState<Set<string>>(
    defaultUnavailableSet
  )

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: initialData
      ? {
          ...initialData,
          category: initialData.category || "vegetable",
          customPricing: defaultCustomPricing,
        }
      : {
          name: "",
          category: "vegetable",
          description: "",
          price: 0,
          status: "active",
          orderQuantity: {
            type: "weight",
            unit: "kg",
          },
          customPricing: defaultCustomPricing,
          imageUrl: "",
          showOnHomePage: true,
          availableInAllDistricts: true,
          unavailableDistricts: [],
        },
  })

  const onSubmit: SubmitHandler<ProductFormValues> = (data) => {
    // Strip out custom pricing overrides that are empty or 0 (which Zod coerces)
    const cleanData = { ...data }
    if (cleanData.customPricing) {
      cleanData.customPricing = cleanData.customPricing.filter(
        (cp) =>
          cp && cp.price !== undefined && cp.price !== null && cp.price > 0
      )
    }

    // Set district availability from local state
    cleanData.availableInAllDistricts = availableInAll
    cleanData.unavailableDistricts = availableInAll
      ? []
      : Array.from(unavailableSet)

    startTransition(async () => {
      try {
        let result
        if (initialData?._id) {
          result = await updateProductAction(initialData._id, cleanData)
        } else {
          result = await createProductAction(cleanData)
        }

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(initialData ? "Product updated!" : "Product created!")
          onSuccess?.()
          if (!initialData) {
            form.reset()
          }
        }
      } catch (err) {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  const {
    formState: { errors },
  } = form
  const orderType = form.watch("orderQuantity.type")

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="e.g. Tomatoes"
              {...form.register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("category")}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onValueChange={(val) =>
                form.setValue("category", val as any, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegetable">Vegetable</SelectItem>
                <SelectItem value="batter">Batter</SelectItem>
                <SelectItem value="greens">Greens</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Short description"
            {...form.register("description")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...form.register("price")}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onValueChange={(val) =>
                form.setValue("status", val as any, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border bg-muted/30 p-4">
          <Checkbox
            id="showOnHomePage"
            checked={form.watch("showOnHomePage")}
            onCheckedChange={(checked) =>
              form.setValue("showOnHomePage", !!checked, { shouldDirty: true })
            }
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="showOnHomePage"
              className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show on Home Page
            </Label>
            <p className="text-xs text-muted-foreground">
              If disabled, this product will be hidden from the Home page
              category sections but will still appear in the Shop page.
            </p>
          </div>
        </div>

        {/* Pricing Configuration */}
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 border-b pb-2 text-sm font-medium">
            District-Wise Pricing Overrides (Optional)
          </h4>
          <p className="mb-4 text-xs text-muted-foreground">
            Set specific prices for different areas. If left missing, it will
            use the default price above.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {districts.map((district, index) => (
              <div key={district._id} className="space-y-2">
                <Label className="truncate text-xs" title={district.name}>
                  {district.name} Price (₹)
                </Label>
                <input
                  type="hidden"
                  {...form.register(
                    `customPricing.${index}.districtId` as const
                  )}
                  value={district._id}
                />
                <Input
                  type="number"
                  step="0.01"
                  {...form.register(`customPricing.${index}.price` as const)}
                />
              </div>
            ))}
          </div>
          {errors.customPricing && (
            <p className="mt-2 text-sm text-red-500">
              Please check custom pricing values.
            </p>
          )}
        </div>

        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium">Order Quantity Config</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.watch("orderQuantity.type")}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onValueChange={(val) => {
                  form.setValue("orderQuantity.type", val as any, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                  if (val === "count") {
                    form.setValue("orderQuantity.unit", "batch")
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Weight (kg/g)</SelectItem>
                  <SelectItem value="count">Batch (count)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === "weight" && (
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="kg, g..."
                  {...form.register("orderQuantity.unit")}
                />
                {errors.orderQuantity?.unit && (
                  <p className="text-sm text-red-500">
                    {errors.orderQuantity.unit.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* District Availability */}
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="border-b pb-2 text-sm font-medium">
            District Availability
          </h4>
          <div className="flex items-center space-x-2 rounded-lg border bg-card p-4">
            <Checkbox
              id="availableInAll"
              checked={availableInAll}
              onCheckedChange={(checked) => {
                setAvailableInAll(!!checked)
                if (checked) setUnavailableSet(new Set())
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="availableInAll"
                className="cursor-pointer text-sm leading-none font-medium"
              >
                Available in all districts
              </Label>
              <p className="text-xs text-muted-foreground">
                Product will be visible on all district routes. Uncheck to
                select specific districts.
              </p>
            </div>
          </div>
          {!availableInAll && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {districts.map((district: any) => {
                const isUnavailable = unavailableSet.has(district._id)
                return (
                  <div
                    key={district._id}
                    className="flex items-center space-x-2 rounded-lg border bg-card p-3"
                  >
                    <Checkbox
                      id={`avail-${district._id}`}
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
                      htmlFor={`avail-${district._id}`}
                      className="cursor-pointer text-sm leading-none"
                    >
                      {district.name}
                    </Label>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Product Image (Optional)</Label>
          <ImageUpload
            defaultImage={form.watch("imageUrl")}
            onUploadComplete={(url) => {
              form.setValue("imageUrl", url, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }}
          />
          {errors.imageUrl && (
            <p className="text-sm text-red-500">{errors.imageUrl.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button disabled={isPending} type="submit">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}

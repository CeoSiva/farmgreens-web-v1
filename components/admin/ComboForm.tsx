"use client"

import { useTransition, useState } from "react"
import {
  useForm,
  useFieldArray,
  SubmitHandler,
  Controller,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createComboAction, updateComboAction } from "@/server/actions/combo"
import { ImageUpload } from "@/components/image-upload"

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const ComboFormSchema = z.object({
  name: z.string().min(1, "Combo name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  pricingMode: z.enum(["fixed", "percent_discount", "per_item"], {
    message: "Pricing mode is required",
  }),
  fixedPrice: z.coerce.number().min(0, "Price must be 0 or more").optional(),
  discountPercent: z.coerce.number().min(0).max(100, "Max 100%").optional(),
  displayOrder: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
  availableInAllDistricts: z.boolean().default(true),
  unavailableDistricts: z.array(z.string()).optional(),
  slots: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("fixed"),
          productId: z.string().min(1, "Product is required"),
          qty: z.coerce.number().min(0.25, "Minimum quantity is 0.25"),
          customPrice: z.coerce.number().min(0).optional(),
        }),
        z.object({
          type: z.literal("choice"),
          label: z.string().optional(),
          pickCount: z.coerce.number().min(1, "Pick count must be at least 1"),
          candidateProductIds: z
            .array(z.string())
            .min(1, "At least one candidate product is required"),
        }),
      ])
    )
    .min(1, "Combo must have at least one slot"),
})

export type ComboFormValues = z.infer<typeof ComboFormSchema>

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProductOption = {
  _id: string
  name: string
  category: string
  price: number
  imageUrl?: string
}

type ComboFormProps = {
  initialData?: {
    _id: string
    name: string
    description?: string
    imageUrl?: string
    isActive: boolean
    pricingMode: "fixed" | "percent_discount" | "per_item"
    fixedPrice?: number
    discountPercent?: number
    displayOrder: number
    availableInAllDistricts: boolean
    unavailableDistricts: string[]
    slots: Array<
      | {
          type: "fixed"
          productId: string
          qty: number
          customPrice?: number
        }
      | {
          type: "choice"
          label?: string
          pickCount: number
          candidateProductIds: string[]
        }
    >
  }
  products: ProductOption[]
  districts: Array<{ _id: string; name: string }>
}

// ─── Product Search Select ─────────────────────────────────────────────────────

function ProductSearchSelect({
  value,
  onChange,
  products,
}: {
  value: string
  onChange: (id: string) => void
  products: ProductOption[]
}) {
  const [search, setSearch] = useState("")
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Search and select product..." />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <div className="p-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        {filtered.slice(0, 20).map((p) => (
          <SelectItem key={p._id} value={p._id}>
            <span className="flex items-center gap-2">
              <span>{p.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                ({p.category})
              </span>
              <span className="ml-auto text-xs font-semibold">₹{p.price}</span>
            </span>
          </SelectItem>
        ))}
        {filtered.length === 0 && (
          <div className="p-3 text-center text-sm text-muted-foreground">
            No products found
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

// ─── Multi Product Select ──────────────────────────────────────────────────────

function MultiProductSelect({
  values,
  onChange,
  products,
}: {
  values: string[]
  onChange: (ids: string[]) => void
  products: ProductOption[]
}) {
  const [search, setSearch] = useState("")

  const toggle = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id))
    } else {
      onChange([...values, id])
    }
  }

  const selectedProducts = products.filter((p) => values.includes(p._id))
  const filtered = products.filter(
    (p) =>
      !values.includes(p._id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search products to add..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8"
      />
      {search && filtered.length > 0 && (
        <div className="max-h-40 divide-y overflow-y-auto rounded-md border bg-card">
          {filtered.slice(0, 15).map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => {
                toggle(p._id)
                setSearch("")
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
            >
              <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span>{p.name}</span>
              <span className="ml-auto text-xs text-muted-foreground capitalize">
                ({p.category})
              </span>
            </button>
          ))}
        </div>
      )}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProducts.map((p) => (
            <Badge
              key={p._id}
              variant="secondary"
              className="gap-1 py-0.5 pr-1 pl-2 text-xs"
            >
              <span className="max-w-[120px] truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => toggle(p._id)}
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {values.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Search and click products above to add them
        </p>
      )}
    </div>
  )
}

// ─── Fixed Slot Row ─────────────────────────────────────────────────────────────

function FixedSlotRow({
  slotIndex,
  control,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors,
  products,
}: {
  slotIndex: number
  control: ReturnType<typeof useForm<ComboFormValues>>["control"]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
  products: ProductOption[]
}) {
  const path = `slots.${slotIndex}` as const

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Fixed Slot
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Product</Label>
          <Controller
            name={`${path}.productId`}
            control={control}
            render={({ field }) => (
              <ProductSearchSelect
                value={field.value as string}
                onChange={field.onChange}
                products={products}
              />
            )}
          />

          {(errors?.slots?.[slotIndex] as any)?.productId && (
            <p className="text-xs text-red-500">
              {(errors?.slots?.[slotIndex] as any)?.productId?.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Controller
            name={`${path}.qty`}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                step="0.25"
                min="0.25"
                {...field}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value) || 0)
                }
              />
            )}
          />
          {(errors?.slots?.[slotIndex] as any)?.qty && (
            <p className="text-xs text-red-500">
              {(errors?.slots?.[slotIndex] as any)?.qty?.message}
            </p>
          )}
        </div>
        <div className="col-span-3 space-y-1">
          <Label className="text-xs text-muted-foreground">
            Override Price (₹, optional)
          </Label>
          <Controller
            name={`${path}.customPrice`}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank to use product price"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Choice Slot Row ───────────────────────────────────────────────────────────

function ChoiceSlotRow({
  slotIndex,
  control,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors,
  products,
}: {
  slotIndex: number
  control: ReturnType<typeof useForm<ComboFormValues>>["control"]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
  products: ProductOption[]
}) {
  const path = `slots.${slotIndex}` as const

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          Choice Slot
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Label (optional)
          </Label>
          <Controller
            name={`${path}.label`}
            control={control}
            render={({ field }) => (
              <Input
                placeholder="e.g. Choose your protein"
                {...field}
                value={field.value ?? ""}
              />
            )}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Pick Count (customer must choose)
          </Label>
          <Controller
            name={`${path}.pickCount`}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min="1"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            )}
          />
          {(errors?.slots?.[slotIndex] as any)?.pickCount && (
            <p className="text-xs text-red-500">
              {(errors?.slots?.[slotIndex] as any)?.pickCount?.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Candidate Products
        </Label>
        <Controller
          name={`${path}.candidateProductIds`}
          control={control}
          render={({ field }) => (
            <MultiProductSelect
              values={field.value ?? []}
              onChange={field.onChange}
              products={products}
            />
          )}
        />
        {(errors?.slots?.[slotIndex] as any)?.candidateProductIds && (
          <p className="text-xs text-red-500">
            {(errors?.slots?.[slotIndex] as any)?.candidateProductIds?.message}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function ComboForm({
  initialData,
  products,
  districts,
}: ComboFormProps) {
  const [isPending, startTransition] = useTransition()
  const [availableInAll, setAvailableInAll] = useState(
    initialData?.availableInAllDistricts ?? true
  )
  const [unavailableSet, setUnavailableSet] = useState<Set<string>>(
    new Set(initialData?.unavailableDistricts ?? [])
  )

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComboFormValues>({
    resolver: zodResolver(ComboFormSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          imageUrl: initialData.imageUrl ?? "",
          pricingMode: initialData.pricingMode,
          fixedPrice: initialData.fixedPrice ?? 0,
          discountPercent: initialData.discountPercent ?? 0,
          displayOrder: initialData.displayOrder ?? 0,
          isActive: initialData.isActive,
          availableInAllDistricts: initialData.availableInAllDistricts,
          unavailableDistricts: initialData.unavailableDistricts,
          slots: initialData.slots as ComboFormValues["slots"],
        }
      : {
          name: "",
          description: "",
          imageUrl: "",
          pricingMode: "fixed",
          fixedPrice: 0,
          discountPercent: 0,
          displayOrder: 0,
          isActive: true,
          availableInAllDistricts: true,
          unavailableDistricts: [],
          slots: [],
        },
  })

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "slots",
  })

  const onSubmit: SubmitHandler<ComboFormValues> = (data) => {
    const cleanData = {
      ...data,
      availableInAllDistricts: availableInAll,
      unavailableDistricts: availableInAll ? [] : Array.from(unavailableSet),
    }

    startTransition(async () => {
      try {
        let result
        if (initialData?._id) {
          result = await updateComboAction(initialData._id, cleanData as any)
        } else {
          result = await createComboAction(cleanData as any)
        }

        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success(initialData ? "Combo updated!" : "Combo created!")
        }
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  const pricingMode = watch("pricingMode")

  const moveSlot = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= fields.length) return
    swap(index, target)
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
      {/* ── Basic Info ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Combo Name</Label>
            <Input
              id="name"
              placeholder="e.g. Healthy Veggie Pack"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              min="0"
              {...register("displayOrder")}
            />
            {errors.displayOrder && (
              <p className="text-sm text-red-500">
                {errors.displayOrder.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what this combo includes..."
            rows={2}
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label>Product Image (Optional)</Label>
          <ImageUpload
            defaultImage={watch("imageUrl")}
            onUploadComplete={(url) => {
              setValue("imageUrl", url, {
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

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <h4 className="border-b pb-2 text-sm font-medium">Pricing</h4>
        <div className="space-y-2">
          <Label>Pricing Mode</Label>
          <Controller
            name="pricingMode"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) =>
                  field.onChange(val as ComboFormValues["pricingMode"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="percent_discount">% Discount</SelectItem>
                  <SelectItem value="per_item">Per Item (sum)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.pricingMode && (
            <p className="text-sm text-red-500">{errors.pricingMode.message}</p>
          )}
        </div>

        {pricingMode === "fixed" && (
          <div className="space-y-2">
            <Label htmlFor="fixedPrice">Fixed Price (₹)</Label>
            <Input
              id="fixedPrice"
              type="number"
              step="0.01"
              min="0"
              {...register("fixedPrice")}
            />
            {errors.fixedPrice && (
              <p className="text-sm text-red-500">
                {errors.fixedPrice.message}
              </p>
            )}
          </div>
        )}

        {pricingMode === "percent_discount" && (
          <div className="space-y-2">
            <Label htmlFor="discountPercent">Discount Percentage (%)</Label>
            <Input
              id="discountPercent"
              type="number"
              min="0"
              max="100"
              {...register("discountPercent")}
            />
            {errors.discountPercent && (
              <p className="text-sm text-red-500">
                {errors.discountPercent.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Slots ───────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-sm font-medium">Combo Slots</h4>
          <span className="text-xs text-muted-foreground">
            {fields.length} slot{fields.length !== 1 ? "s" : ""}
          </span>
        </div>

        {errors.slots && typeof errors.slots.message === "string" && (
          <p className="text-sm text-red-500">{errors.slots.message}</p>
        )}

        {/* Slot list */}
        <div className="space-y-2">
          {fields.map((field, index) => {
            const slotValue = watch(`slots.${index}`)
            return (
              <div key={field.id} className="flex items-start gap-2">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveSlot(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveSlot(index, "down")}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Slot content */}
                <div className="flex-1">
                  {slotValue?.type === "fixed" ? (
                    <FixedSlotRow
                      slotIndex={index}
                      control={control}
                      errors={errors}
                      products={products}
                    />
                  ) : (
                    <ChoiceSlotRow
                      slotIndex={index}
                      control={control}
                      errors={errors}
                      products={products}
                    />
                  )}
                </div>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7 h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {fields.length === 0 && (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No slots added yet. Use the buttons below to add slots.
          </div>
        )}

        {/* Add slot buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                type: "fixed",
                productId: "",
                qty: 1,
                customPrice: undefined,
              })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Fixed Slot
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                type: "choice",
                label: "",
                pickCount: 1,
                candidateProductIds: [],
              })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Choice Slot
          </Button>
        </div>
      </div>

      {/* ── District Availability ────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
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
              Uncheck to restrict to specific districts.
            </p>
          </div>
        </div>
        {!availableInAll && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {districts.map((district) => {
              const isUnavailable = unavailableSet.has(district._id)
              return (
                <div
                  key={district._id}
                  className="flex items-center space-x-2 rounded-lg border bg-card p-3"
                >
                  <Checkbox
                    id={`combo-avail-${district._id}`}
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
                    htmlFor={`combo-avail-${district._id}`}
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

      {/* ── Active Toggle ────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 rounded-lg border bg-muted/30 p-4">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="isActive"
            className="cursor-pointer text-sm leading-none font-medium"
          >
            Combo Active
          </Label>
          <p className="text-xs text-muted-foreground">
            Inactive combos will not appear on the storefront.
          </p>
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-4">
        <Button disabled={isPending} type="submit">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Combo" : "Create Combo"}
        </Button>
      </div>
    </form>
  )
}

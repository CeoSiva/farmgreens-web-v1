"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import type { Cart } from "@/lib/cart"
import { CheckoutSchema, type CheckoutFormValues } from "@/lib/schemas/checkout"
import { findCustomerByMobileAction } from "@/server/actions/customer"
import {
  listAreasByDistrictAction,
  listApartmentsByDistrictAction,
} from "@/server/actions/location"
import { createAreaAction } from "@/server/actions/location-admin"
import { placeOrderAction } from "@/server/actions/order"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function CheckoutClient({
  cart,
  districts,
  deliveryFee,
  districtSlug,
}: {
  cart: Cart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  districts: any[]
  deliveryFee: number
  districtSlug?: string
}) {
  const [isPending, startTransition] = useTransition()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [areas, setAreas] = useState<any[]>([])
  const [apartments, setApartments] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingCustomer, setExistingCustomer] = useState<any | null>(null)
  const [areaSearch, setAreaSearch] = useState("")
  const [areaOpen, setAreaOpen] = useState(false)
  const [apartmentSearch, setApartmentSearch] = useState("")
  const [apartmentOpen, setApartmentOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      name: "",
      mobile: "",
      door: "",
      street: "",
      districtId: "",
      areaId: "",
      countryCode: "+91",
      saveDetails: true,
    },
  })

  const districtId = watch("districtId")
  const mobile = watch("mobile")

  useEffect(() => {
    if (!districtId) return
    startTransition(async () => {
      const [resAreas, resApts] = await Promise.all([
        listAreasByDistrictAction(districtId),
        listApartmentsByDistrictAction(districtId),
      ])
      setAreas((resAreas as any).areas)
      setApartments((resApts as any).apartments)

      const currentAreaId = getValues("areaId")
      const stillValid = (resAreas as any).areas.some(
        (a: any) => a._id === currentAreaId
      )
      if (!stillValid) {
        setValue("areaId", "")
      }
    })
  }, [districtId, setValue, getValues])

  // Auto-set district from URL slug (e.g., /chennai/checkout)
  useEffect(() => {
    if (!districtSlug || districtId) return
    const match = districts.find(
      (d: any) => d.name.toLowerCase() === districtSlug.toLowerCase()
    )
    if (match) {
      setValue("districtId", match._id)
    }
  }, [districtSlug, districts, setValue, districtId])

  useEffect(() => {
    if (!mobile || mobile.length < 10) {
      setExistingCustomer(null)
      return
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await findCustomerByMobileAction(mobile)
          setExistingCustomer(res.customer)
        } catch {
          setExistingCustomer(null)
        }
      })
    }, 500)

    return () => clearTimeout(t)
  }, [mobile])

  const canCheckout = cart.items.length > 0

  const summary = useMemo(() => {
    const itemCount = cart.items.length
    return { itemCount }
  }, [cart.items])

  const isChennai = useMemo(() => {
    if (!districtId || !districts) return false
    const d = districts.find((x) => String(x._id) === String(districtId))
    return d && d.name.toLowerCase() === "chennai"
  }, [districtId, districts])

  const filteredAreas = useMemo(() => {
    if (!areaSearch) return areas
    const q = areaSearch.toLowerCase()
    return areas.filter((a: any) => a.name.toLowerCase().includes(q))
  }, [areas, areaSearch])

  const exactMatch = areas.some(
    (a: any) => a.name.toLowerCase() === areaSearch.toLowerCase().trim()
  )

  const filteredApartments = useMemo(() => {
    if (!apartmentSearch) return apartments
    const q = apartmentSearch.toLowerCase()
    return apartments.filter((a: any) => a.name.toLowerCase().includes(q))
  }, [apartments, apartmentSearch])

  const handleCreateArea = async () => {
    if (!districtId || !areaSearch.trim()) return
    startTransition(async () => {
      try {
        const res = await createAreaAction({
          districtId,
          name: areaSearch.trim(),
        })
        if ((res as any).error) {
          toast.error((res as any).error)
          return
        }
        const newArea = (res as any).area
        setAreas((prev) =>
          [...prev, newArea].sort((a: any, b: any) =>
            a.name.localeCompare(b.name)
          )
        )
        setValue("areaId", newArea._id)
        setAreaSearch("")
        setAreaOpen(false)
        toast.success("Area added")
      } catch {
        toast.error("Failed to add area")
      }
    })
  }

  const onSubmit = (data: CheckoutFormValues) => {
    setValue("countryCode", "+91")
    startTransition(async () => {
      try {
        const res = await placeOrderAction(data)
        if ((res as any)?.error) {
          toast.error((res as any).error)
          return
        }
        toast.success("Order placed")
        window.location.href = `/order-confirmed/${(res as any).orderNumber}`
      } catch {
        toast.error("Failed to place order")
      }
    })
  }

  if (!canCheckout) {
    return (
      <Card className="p-6">
        <div className="text-muted-foreground">
          Your cart is empty. Add products before checkout.
        </div>
        <div className="mt-4">
          <Button asChild>
            <Link href="/shop">Go to shop</Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Order summary</div>
            <div className="text-sm text-muted-foreground">
              {summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Delivery fee:{" "}
            {deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(2)}`}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {/* Section: Contact Details */}
          <div>
            <h3 className="text-sm font-semibold">Contact details</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              We&apos;ll use this to confirm your order.
            </p>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Full name</label>
                <Input
                  {...register("name")}
                  placeholder="Your full name"
                  disabled={isPending}
                />
                {errors.name && (
                  <div className="text-xs text-destructive">
                    {errors.name.message}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Mobile number</label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    type="tel"
                    {...register("mobile")}
                    placeholder="9876543210"
                    className="rounded-l-none"
                    disabled={isPending}
                  />
                </div>
                {errors.mobile && (
                  <div className="text-xs text-destructive">
                    {errors.mobile.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Saved addresses (auto-filled when mobile matches) */}
          {existingCustomer &&
            Array.isArray(existingCustomer.addresses) &&
            existingCustomer.addresses.length > 0 && (
              <Card className="bg-muted/30 p-3">
                <div className="text-sm font-medium">Saved addresses</div>
                <div className="mt-2 grid gap-2">
                  {existingCustomer.addresses
                    .slice(0, 3)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((a: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        className="rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setValue("door", a.door)
                          setValue("street", a.street)
                          setValue("districtId", String(a.districtId))
                          setValue("areaId", a.areaId ? String(a.areaId) : "")
                          toast.success("Filled from saved address")
                        }}
                      >
                        <div className="font-medium">
                          {existingCustomer.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.door}, {a.street}
                        </div>
                      </button>
                    ))}
                </div>
              </Card>
            )}

          <Separator />

          {/* Section: Delivery Address */}
          <div>
            <h3 className="text-sm font-semibold">Delivery address</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Where should we deliver your order?
            </p>

            <div className="grid gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">District</label>
                  <Select
                    onValueChange={(val) => setValue("districtId", val)}
                    value={watch("districtId")}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.districtId && (
                    <div className="text-xs text-destructive">
                      {errors.districtId.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Area{isChennai ? " (optional)" : ""}
                  </label>
                  <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={areaOpen}
                        className="w-full justify-between font-normal"
                        disabled={isPending || !districtId}
                      >
                        {watch("areaId")
                          ? areas.find((a: any) => a._id === watch("areaId"))
                              ?.name
                          : isChennai
                            ? "Select area (optional)"
                            : "Select area"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <div className="p-2">
                        <Input
                          placeholder="Search areas..."
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto px-1 pb-1">
                        {filteredAreas.length > 0 ? (
                          filteredAreas.map((a: any) => (
                            <button
                              key={a._id}
                              type="button"
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                setValue("areaId", a._id)
                                setAreaSearch("")
                                setAreaOpen(false)
                              }}
                            >
                              <Check
                                className={`h-4 w-4 ${watch("areaId") === a._id ? "opacity-100" : "opacity-0"}`}
                              />
                              {a.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-center text-xs text-muted-foreground">
                            No areas found.
                          </div>
                        )}
                        {areaSearch.trim() && !exactMatch && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={handleCreateArea}
                            disabled={isPending}
                          >
                            <Plus className="h-4 w-4" />
                            Add &quot;{areaSearch.trim()}&quot;
                          </button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {errors.areaId && !isChennai && (
                    <div className="text-xs text-destructive">
                      {errors.areaId.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    {isChennai ? "Apartment" : "Street"}
                  </label>
                  {isChennai ? (
                    <Popover
                      open={apartmentOpen}
                      onOpenChange={setApartmentOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={apartmentOpen}
                          className="w-full justify-between font-normal"
                          disabled={isPending || !districtId}
                        >
                          {watch("street")
                            ? apartments.find(
                                (a: any) => a.name === watch("street")
                              )?.name || watch("street")
                            : "Select apartment"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <div className="p-2">
                          <Input
                            placeholder="Search apartments..."
                            value={apartmentSearch}
                            onChange={(e) => setApartmentSearch(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto px-1 pb-1">
                          {filteredApartments.length > 0 ? (
                            filteredApartments.map((a: any) => (
                              <button
                                key={a._id}
                                type="button"
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                  setValue("street", a.name)
                                  setApartmentSearch("")
                                  setApartmentOpen(false)
                                }}
                              >
                                <Check
                                  className={`h-4 w-4 ${watch("street") === a.name ? "opacity-100" : "opacity-0"}`}
                                />
                                {a.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-2 py-2 text-center text-xs text-muted-foreground">
                              No apartments found.
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      {...register("street")}
                      placeholder="Main road, Gandhi nagar"
                      disabled={isPending}
                    />
                  )}
                  {errors.street && (
                    <div className="text-xs text-destructive">
                      {errors.street.message}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Flat no, Block / Tower
                  </label>
                  <Input
                    {...register("door")}
                    placeholder="12A, Ground floor"
                    disabled={isPending}
                  />
                  {errors.door && (
                    <div className="text-xs text-destructive">
                      {errors.door.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Save details */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={watch("saveDetails")}
              onCheckedChange={(v) => setValue("saveDetails", Boolean(v))}
              disabled={isPending}
              id="saveDetails"
            />
            <label htmlFor="saveDetails" className="text-sm">
              Save my details for next time
            </label>
          </div>

          <Button type="submit" disabled={isPending} size="lg">
            Place order (COD)
          </Button>
        </form>
      </Card>
    </div>
  )
}

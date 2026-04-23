"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { trackBeginCheckout, trackPurchase, trackDistrictSelected, trackWhatsAppOptIn, trackWhatsAppOptOut } from "@/lib/analytics"
import { Check, ChevronsUpDown, Plus, CreditCard, Banknote } from "lucide-react"

import type { Cart } from "@/lib/cart"
import { CheckoutSchema, type CheckoutFormValues } from "@/lib/schemas/checkout"
import { findCustomerByMobileAction } from "@/server/actions/customer"
import {
  listAreasByDistrictAction,
  listApartmentsByDistrictAction,
} from "@/server/actions/location"
import { createAreaAction } from "@/server/actions/location-admin"
import { placeOrderAction } from "@/server/actions/order"
import {
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction,
  placeOrderAfterPaymentAction,
} from "@/server/actions/payment"

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
import { MapPicker } from "@/components/checkout/map-picker"
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
  const [locationPinned, setLocationPinned] = useState(false)
  const [mapHighlight, setMapHighlight] = useState(false)

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
      whatsappOptIn: true,
      lat: 0,
      lng: 0,
      paymentMethod: "online",
    },
  })

  const districtId = watch("districtId")
  const mobile = watch("mobile")
  const lat = watch("lat")
  const lng = watch("lng")
  const paymentMethod = watch("paymentMethod")

  const handleLocationChange = (newLat: number, newLng: number) => {
    setValue("lat", newLat)
    setValue("lng", newLng)
    setLocationPinned(true)
  }

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
      // Track district selection
      trackDistrictSelected(districtSlug, match.name, existingCustomer?._id?.toString() || "")
    }
  }, [districtSlug, districts, setValue, districtId, existingCustomer])

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

  // Track begin_checkout when checkout page loads
  useEffect(() => {
    if (canCheckout && cart.items.length > 0) {
      trackBeginCheckout(0, cart.items.length, existingCustomer?._id?.toString(), districtSlug || "")
    }
  }, [canCheckout, cart.items, existingCustomer, districtSlug])

  // Track WhatsApp opt-in/out changes
  const whatsappOptIn = watch("whatsappOptIn")
  useEffect(() => {
    if (existingCustomer?._id && whatsappOptIn !== undefined) {
      if (whatsappOptIn) {
        trackWhatsAppOptIn(existingCustomer._id.toString())
      } else {
        trackWhatsAppOptOut(existingCustomer._id.toString())
      }
    }
  }, [whatsappOptIn, existingCustomer])

  const showValidationErrorsToast = () => {
    const errorMessages: string[] = []
    const fieldMap: Record<string, string> = {
      name: "Full name",
      mobile: "Mobile number",
      door: "Door/Flat",
      street: "Street",
      districtId: "District",
      areaId: "Area",
      lat: "Location",
      lng: "Location",
    }

    // Highlight all invalid fields
    Object.keys(errors).forEach((key) => {
      const element = document.querySelector(`[name="${key}"]`) as HTMLElement
      if (element) {
        element.classList.add("ring-2", "ring-destructive")
        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-destructive")
        }, 3000)
      }
    })

    Object.keys(errors).forEach((key) => {
      const message = errors[key as keyof typeof errors]?.message
      if (message) {
        const fieldName = fieldMap[key] || key
        errorMessages.push(`${fieldName}: ${message}`)
      }
    })

    if (errorMessages.length > 0) {
      toast.error("Please fix the following errors:", {
        description: (
          <ul className="list-disc pl-4 mt-2">
            {errorMessages.map((msg, idx) => (
              <li key={idx} className="text-sm">{msg}</li>
            ))}
          </ul>
        ),
        action: {
          label: "Go to first error",
          onClick: () => {
            const firstErrorKey = Object.keys(errors)[0]
            const element = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" })
              element.focus()
            }
          },
        },
      })
    }
  }

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

  const onSubmit = async (data: CheckoutFormValues) => {
    // Check if location is pinned before submission
    if (!locationPinned) {
      toast.error("Please pin your delivery location on the map before placing your order")
      setMapHighlight(true)
      // Scroll to map section
      const mapElement = document.querySelector("#checkout-map") as HTMLElement
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      // Clear highlight after 3 seconds
      setTimeout(() => {
        setMapHighlight(false)
      }, 3000)
      return
    }

    // Check for validation errors before submission
    if (Object.keys(errors).length > 0) {
      showValidationErrorsToast()
      return
    }

    setValue("countryCode", "+91")

    if (data.paymentMethod === "online") {
      // Online payment flow with Razorpay
      startTransition(async () => {
        try {
          // Create Razorpay order (server will calculate total from cart)
          const razorpayRes = await createRazorpayOrderAction(data.districtId)
          if (!razorpayRes.success) {
            toast.error((razorpayRes as any).error || "Failed to create payment order")
            return
          }

          // Load Razorpay checkout script dynamically
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.async = true
          script.onload = () => {
            const options = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              amount: (razorpayRes as any).amount,
              currency: "INR",
              name: "FarmGreens",
              description: "Order Payment",
              order_id: (razorpayRes as any).orderId,
              handler: async (response: any) => {
                // Verify payment signature
                const verifyRes = await verifyRazorpayPaymentAction(
                  (razorpayRes as any).orderId,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                )

                if (!verifyRes.success) {
                  toast.error("Payment verification failed")
                  return
                }

                // Place order after successful payment verification
                const orderRes = await placeOrderAfterPaymentAction(
                  data,
                  response.razorpay_payment_id,
                  (razorpayRes as any).orderId
                )

                if (orderRes.error) {
                  toast.error(orderRes.error)
                  return
                }

                // Track purchase event
                trackPurchase(orderRes.orderNumber || "", 0, cart.items.length, existingCustomer?._id?.toString() || "", districtSlug || "")

                toast.success("Payment successful")
                window.location.href = `/order-confirmed/${orderRes.orderNumber}`
              },
              prefill: {
                name: data.name,
                contact: `${data.countryCode}${data.mobile}`,
              },
              theme: {
                color: "#16a34a",
              },
              modal: {
                ondismiss: () => {
                  toast.error("Payment cancelled")
                },
              },
            }

            const rzp = new (window as any).Razorpay(options)
            rzp.open()
          }
          script.onerror = () => {
            toast.error("Failed to load payment gateway")
          }
          document.body.appendChild(script)
        } catch {
          toast.error("Failed to process payment")
        }
      })
    } else {
      // COD flow
      startTransition(async () => {
        try {
          const res = await placeOrderAction(data)
          if ((res as any)?.error) {
            toast.error((res as any).error)
            return
          }

          // Track purchase event
          trackPurchase((res as any).orderNumber || "", 0, cart.items.length, existingCustomer?._id?.toString() || "", districtSlug || "")

          toast.success("Order placed")
          window.location.href = `/order-confirmed/${(res as any).orderNumber}`
        } catch {
          toast.error("Failed to place order")
        }
      })
    }
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

              <div id="checkout-map">
                <MapPicker
                  initialLat={lat !== 0 ? lat : undefined}
                  initialLng={lng !== 0 ? lng : undefined}
                  onLocationChange={handleLocationChange}
                  highlight={mapHighlight}
                />
              </div>
              {errors.lat && (
                <div className="text-xs text-destructive">
                  {errors.lat.message}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Payment method</h3>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  {...register("paymentMethod")}
                  value="online"
                  disabled={isPending}
                  className="h-4 w-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Online Payment</div>
                  <div className="text-xs text-muted-foreground">Pay securely with Razorpay</div>
                </div>
                <CreditCard className="h-5 w-5 text-primary" />
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  {...register("paymentMethod")}
                  value="cod"
                  disabled={isPending}
                  className="h-4 w-4 text-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">Cash on Delivery</div>
                  <div className="text-xs text-muted-foreground">Pay when you receive your order</div>
                </div>
                <Banknote className="h-5 w-5 text-primary" />
              </label>
            </div>
            {errors.paymentMethod && (
              <div className="text-xs text-destructive mt-2">
                {errors.paymentMethod.message}
              </div>
            )}
          </div>

          <Separator />

          {/* Save details & Notifications */}
          <div className="grid gap-3">
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
            <div className="flex items-center gap-2">
              <Checkbox
                checked={watch("whatsappOptIn")}
                onCheckedChange={(v) => setValue("whatsappOptIn", Boolean(v))}
                disabled={isPending}
                id="whatsappOptIn"
              />
              <label htmlFor="whatsappOptIn" className="text-sm cursor-pointer select-none">
                Send me order updates by WhatsApp
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className={!locationPinned ? "opacity-50 cursor-not-allowed" : undefined}
            onClickCapture={(e) => {
              if (locationPinned) return
              e.preventDefault()
              e.stopPropagation()
              toast.error(
                "Please pin your delivery location on the map before placing your order"
              )
              setMapHighlight(true)
              const mapElement = document.querySelector("#checkout-map") as HTMLElement
              if (mapElement) {
                mapElement.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              setTimeout(() => {
                setMapHighlight(false)
              }, 3000)
            }}
          >
            {paymentMethod === "online" ? "Pay Online" : "Place order (COD)"}
          </Button>
          {!locationPinned && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please pin your delivery location on the map to continue
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}

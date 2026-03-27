"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import type { Cart } from "@/lib/cart"
import { CheckoutSchema, type CheckoutFormValues } from "@/lib/schemas/checkout"
import { findCustomerByMobileAction } from "@/server/actions/customer"
import { listAreasByDistrictAction } from "@/server/actions/location"
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

export function CheckoutClient({
  cart,
  districts,
  deliveryFee,
}: {
  cart: Cart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  districts: any[]
  deliveryFee: number
}) {
  const [isPending, startTransition] = useTransition()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [areas, setAreas] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingCustomer, setExistingCustomer] = useState<any | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      countryCode: "+91",
      saveDetails: true,
    },
  })

  const districtId = watch("districtId")
  const mobile = watch("mobile")

  useEffect(() => {
    if (!districtId) return
    startTransition(async () => {
      const res = await listAreasByDistrictAction(districtId)
      setAreas(res.areas as any)
      setValue("areaId", "")
    })
  }, [districtId, setValue])

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
    const itemCount = cart.items.reduce((acc, i) => acc + i.qty, 0)
    return { itemCount }
  }, [cart.items])

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
            Delivery fee: ₹{deliveryFee.toFixed(2)}
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
                          setValue("areaId", String(a.areaId))
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
                  <label className="text-sm font-medium">Door / Flat</label>
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

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Street</label>
                  <Input
                    {...register("street")}
                    placeholder="Main road, Gandhi nagar"
                    disabled={isPending}
                  />
                  {errors.street && (
                    <div className="text-xs text-destructive">
                      {errors.street.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">District</label>
                  <Select
                    onValueChange={(val) => setValue("districtId", val)}
                    value={watch("districtId")}
                    disabled={isPending}
                  >
                    <SelectTrigger>
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
                  <label className="text-sm font-medium">Area</label>
                  <Select
                    onValueChange={(val) => setValue("areaId", val)}
                    value={watch("areaId")}
                    disabled={isPending || !districtId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.areaId && (
                    <div className="text-xs text-destructive">
                      {errors.areaId.message}
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

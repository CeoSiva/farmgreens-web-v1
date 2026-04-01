import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { CheckCircle2, User, MapPin, Package, Calendar } from "lucide-react"
import Image from "next/image"

import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { getOrderByNumber } from "@/lib/data/order"
import { getProductsByIds } from "@/lib/data/product"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatQuantity } from "@/lib/utils/format"

export const dynamic = "force-dynamic"

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const order = await getOrderByNumber(orderNumber)

  let imageMap: Map<string, string> = new Map()
  if (order) {
    const productIds = order.items.map((item: any) => item.productId.toString())
    const products = await getProductsByIds(productIds)
    for (const p of products) {
      if (p.imageUrl) imageMap.set(p._id.toString(), p.imageUrl)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="w-full flex-1 px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-2xl">
          {order ? (
            <div className="grid gap-6">
              {/* Success Header */}
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Order Confirmed!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Thank you, {order.customer.name}! Your order has been placed.
                </p>
              </div>

              {/* Order Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">
                    {orderNumber}
                  </span>
                  <Badge
                    variant={
                      order.status === "placed"
                        ? "outline"
                        : order.status === "delivered"
                          ? "default"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(order.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              {/* Contact & Address */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold tracking-widest uppercase">
                      Contact
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-muted-foreground">
                      {order.customer.countryCode} {order.customer.mobile}
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="rounded-full bg-orange-100 p-1.5 text-orange-600">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold tracking-widest uppercase">
                      Delivering To
                    </h3>
                  </div>
                  <div className="space-y-0.5 text-sm">
                    <p>
                      {order.shippingAddress.door},{" "}
                      {order.shippingAddress.street}
                    </p>
                    <p className="font-medium">
                      {order.shippingAddress.areaName},{" "}
                      {order.shippingAddress.districtName}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Order Items */}
              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-1.5 text-blue-600">
                    <Package className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-xs font-bold tracking-widest uppercase">
                    Items ({order.items.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {order.items.map((item: any, idx: number) => {
                    const imgUrl = imageMap.get(item.productId.toString())
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-lg border bg-background p-3"
                      >
                        {imgUrl ? (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                            <Image
                              src={imgUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-1 items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ₹{item.price.toFixed(2)} / {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground">
                              × {formatQuantity(item.qty, item.unit)}
                            </p>
                            <p className="text-sm font-bold">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Payment Summary */}
              <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
                <h3 className="mb-4 text-xs font-bold tracking-widest uppercase opacity-80">
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm opacity-70">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm opacity-70">
                    <span>Delivery Fee</span>
                    <span>
                      {order.deliveryFee === 0
                        ? "Free"
                        : `₹${order.deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <Separator className="my-4 bg-white/10" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Cash on Delivery
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/">Home</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Order #{orderNumber}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Could not load order details yet. Please check back in a moment.
              </p>
              <div className="mt-6 flex gap-2">
                <Button asChild>
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Home</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

import { LocationAwareLink as Link } from "@/components/location-aware-link"

import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { getOrderByNumber } from "@/lib/data/order"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const order = await getOrderByNumber(orderNumber)

  return (
    <div className="flex min-h-screen flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-3xl">
          <Card className="p-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Order confirmed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Thanks! Your order has been placed.
            </p>

            <div className="mt-6 grid gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Order number:</span>{" "}
                <span className="font-medium">{orderNumber}</span>
              </div>
              {order ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-medium">₹{order.total.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  Could not load order details yet.
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Button asChild>
                <Link href="/shop">Continue shopping</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Home</Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

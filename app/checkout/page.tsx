import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { getCartAction } from "@/server/actions/cart"
import { listDistrictsAction } from "@/server/actions/location"
import { CheckoutClient } from "@/components/checkout/checkout-client"
import { getSettings } from "@/lib/data/setting"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const { cart } = await getCartAction()
  const settings = await getSettings()
  const deliveryFee = Number((settings as any).deliveryFee ?? 0)
  const { districts } = await listDistrictsAction()

  return (
    <div className="flex min-h-screen flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter delivery details and place your order.
          </p>deliveryFee={deliveryFee} 

          <div className="mt-6">
            <CheckoutClient cart={cart} districts={districts as any} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

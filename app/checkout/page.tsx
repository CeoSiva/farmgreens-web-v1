import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { getCartAction } from "@/server/actions/cart"
import { getProductsByIds } from "@/lib/data/product"
import { listDistrictsAction } from "@/server/actions/location"
import { CheckoutClient } from "@/components/checkout/checkout-client"
import { getSettings } from "@/lib/data/setting"
import { getSystemSetting } from "@/lib/data/system-setting"

export const dynamic = "force-dynamic"

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ district?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const districtSlug = sp.district

  const { cart } = await getCartAction()
  const settings = await getSettings()
  const baseDeliveryFee = Number((settings as any).deliveryFee ?? 0)
  const freeDeliveryThreshold = Number(
    (settings as any).freeDeliveryThreshold ?? 500
  )
  const { districts } = await listDistrictsAction()

  // Compute subtotal on the server for checkout display
  const ids = cart.items.map((i: any) => i.productId)
  const productsRaw = await getProductsByIds(ids, districtSlug)
  const byId = new Map(productsRaw.map((p: any) => [p._id.toString(), p]))
  const subtotal = cart.items.reduce((acc: number, it: any) => {
    const p = byId.get(it.productId)
    if (!p) return acc
    return acc + p.price * it.qty
  }, 0)

  const effectiveDeliveryFee =
    subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee

  const bannerMessage = await getSystemSetting("delivery_banner_message")

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="w-full flex-1 px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter delivery details and place your order.
          </p>

          <div className="mt-6">
            <CheckoutClient
              cart={cart}
              districts={districts as any}
              deliveryFee={effectiveDeliveryFee}
              districtSlug={districtSlug}
              bannerMessage={bannerMessage}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

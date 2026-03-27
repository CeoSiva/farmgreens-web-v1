import { getCartAction } from "@/server/actions/cart"
import { getProductsByIds } from "@/lib/data/product"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { CartClient } from "@/components/cart/cart-client"
import { getSettings } from "@/lib/data/setting"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const { cart } = await getCartAction()
  const ids = cart.items.map((i) => i.productId)
  const settings = await getSettings()
  const deliveryFee = Number((settings as any).deliveryFee ?? 0)
  const productsRaw = await getProductsByIds(ids)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = productsRaw.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    status: p.status,
    orderQuantity: p.orderQuantity,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt?.toISOString?.() ?? "",
    updatedAt: p.updatedAt?.toISOString?.() ?? "",
  }))

  return (
    <div className="flex min-h-screen flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review items and proceed to checkout.
          </p>

          <div className="mt-6">
            <CartClient cart={cart} products={products} deliveryFee={deliveryFee} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

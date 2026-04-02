import { getCartAction } from "@/server/actions/cart"
import { getProductsByIds, getProducts } from "@/lib/data/product"
import { ProductGrid } from "@/components/landing/product-grid"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { CartClient } from "@/components/cart/cart-client"
import { getSettings } from "@/lib/data/setting"

export const dynamic = "force-dynamic"

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<{ district?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const districtSlug = sp.district

  const { cart } = await getCartAction()
  const ids = cart.items.map((i) => i.productId)
  const settings = await getSettings()
  const deliveryFee = Number((settings as any).deliveryFee ?? 0)
  const freeDeliveryThreshold = Number(
    (settings as any).freeDeliveryThreshold ?? 500
  )
  const productsRaw = await getProductsByIds(ids, districtSlug)

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
    isAvailable: p.isAvailable ?? true,
    createdAt: p.createdAt?.toISOString?.() ?? "",
    updatedAt: p.updatedAt?.toISOString?.() ?? "",
  }))

  const allProductsRaw = await getProducts(districtSlug)
  const recommendedRaw = allProductsRaw
    .filter(
      (p: any) => p.status === "active" && !ids.includes(p._id.toString())
    )
    .slice(0, 10)

  const recommendedProducts = recommendedRaw.map((p: any) => ({
    _id: p._id.toString(),
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    status: p.status,
    orderQuantity: p.orderQuantity,
    imageUrl: p.imageUrl,
    isAvailable: p.isAvailable ?? true,
    createdAt: p.createdAt?.toISOString?.() ?? "",
    updatedAt: p.updatedAt?.toISOString?.() ?? "",
  }))

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="w-full flex-1 px-4 py-10 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review items and proceed to checkout.
          </p>

          <div className="mt-6">
            <CartClient
              cart={cart}
              products={products}
              deliveryFee={deliveryFee}
              freeDeliveryThreshold={freeDeliveryThreshold}
            />
          </div>
        </div>

        {/* Cross-Sell / Recommendations Section */}
        {recommendedProducts.length > 0 && (
          <div className="mx-auto mt-16 max-w-7xl border-t pt-8 md:mt-24 md:pt-12">
            <ProductGrid
              title="You might also like"
              products={recommendedProducts}
              seeAllLink="/shop"
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

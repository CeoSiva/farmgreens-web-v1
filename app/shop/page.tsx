import { getProducts } from "@/lib/data/product"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ShopClient } from "@/components/shop/shop-client"

export const dynamic = "force-dynamic"

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>
}) {
  const rawProducts = await getProducts()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = rawProducts.map((p: any) => ({
    _id: p._id.toString(),
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    status: p.status,
    orderQuantity: p.orderQuantity,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const sp = (await searchParams) ?? {}
  const initialCategory = sp.category ?? "all"

  return (
    <div className="flex min-h-screen flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full">
        <ShopClient products={products} initialCategory={initialCategory} />
      </main>
      <Footer />
    </div>
  )
}

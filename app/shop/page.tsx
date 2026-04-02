import { getProducts } from "@/lib/data/product"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ShopClient } from "@/components/shop/shop-client"

export const dynamic = "force-dynamic"

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string
    search?: string
    district?: string
  }>
}) {
  const sp = (await searchParams) ?? {}
  const districtSlug = sp.district

  const rawProducts = await getProducts(districtSlug)

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
    isAvailable: p.isAvailable ?? true,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const initialCategory = sp.category ?? "all"
  const initialSearch = sp.search ?? ""

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="w-full flex-1">
        <ShopClient
          products={products}
          initialCategory={initialCategory}
          initialSearch={initialSearch}
        />
      </main>
      <Footer />
    </div>
  )
}

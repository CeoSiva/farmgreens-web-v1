import { notFound } from "next/navigation"
import { getProductById } from "@/lib/data/product"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ProductDetailClient } from "@/components/product/product-detail-client"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ district?: string }>
}) {
  const { id } = await params
  const sp = (await searchParams) ?? {}
  const districtSlug = sp.district

  const raw = await getProductById(id, districtSlug)
  if (!raw) notFound()

  const product = {
    _id: (raw as any)._id.toString(),
    name: raw.name,
    category: raw.category,
    description: raw.description,
    price: raw.price,
    status: raw.status,
    orderQuantity: raw.orderQuantity,
    imageUrl: raw.imageUrl,
    createdAt: raw.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: raw.updatedAt?.toISOString() || new Date().toISOString(),
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ProductDetailClient product={product} />
      </main>
      <Footer />
    </div>
  )
}

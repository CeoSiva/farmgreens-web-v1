import { getProducts } from "@/lib/data/product"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { CategoryChips } from "@/components/landing/category-chips"
import { ProductGrid } from "@/components/landing/product-grid"
import { PromoBanners } from "@/components/landing/promo-banners"
import { InfoCards } from "@/components/landing/info-cards"
import { CallToAction } from "@/components/landing/call-to-action"
import { TrustBar } from "@/components/landing/trust-bar"
import { Footer } from "@/components/landing/footer"

export const dynamic = "force-dynamic"

export default async function Page() {
  // Fetch real products from the database
  const rawProducts = await getProducts()
  
  // Serialize documents for Server Component -> Client Component prop passing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = rawProducts.map((p: any) => ({
    _id: p._id.toString(),
    id: p._id.toString(), // some components might expect id instead of _id
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

  const popularProducts = products.slice(0, 8); // Display only top 8 for UI grid

  return (
    <div className="flex min-h-screen flex-col w-full">
      {/* 1. Header/Navigation */}
      <Navbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Category Filter Chips (Above products grid) */}
        <CategoryChips />

        {/* 4. Product Grids */}
        <ProductGrid 
          title="Popular Choices" 
          products={popularProducts} 
          seeAllLink="/shop"
        />
        
        {/* 5. Promotional Banners */}
        <PromoBanners />

        {/* 6. Feature Info Cards */}
        <InfoCards />

        {/* 7. Full Width CTA */}
        <CallToAction />

        {/* 8. Trust Bar / Strip */}
        <TrustBar />
      </main>

      {/* 9. Full Footer */}
      <Footer />
    </div>
  )
}

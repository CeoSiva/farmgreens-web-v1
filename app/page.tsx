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

import { Suspense } from "react"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { category: activeCategory } = await searchParams;

  // Fetch real products from the database
  const rawProducts = await getProducts()
  
  // Serialize documents for Server Component -> Client Component prop passing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProducts = rawProducts.map((p: any) => ({
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

  // Filter by category if requested
  const filteredProducts = activeCategory && activeCategory !== "All Products"
    ? allProducts.filter(p => p.category === activeCategory)
    : allProducts;

  const displayProducts = filteredProducts.slice(0, 8); // Display only top 8 for UI grid

  const categoryLabels: Record<string, string> = {
    vegetable: "Vegetables",
    greens: "Fresh Greens",
    batter: "Idli/Dosa Batter",
  }

  const sectionTitle = activeCategory && categoryLabels[activeCategory as string] 
    ? categoryLabels[activeCategory as string] 
    : "Popular Choices";

  return (
    <div className="flex min-h-screen flex-col w-full">
      {/* 1. Header/Navigation */}
      <Navbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Category Filter Chips (Above products grid) */}
        <Suspense fallback={<div className="h-20" />}>
          <CategoryChips />
        </Suspense>

        {/* 4. Product Grids */}
        <ProductGrid 
          title={sectionTitle} 
          products={displayProducts} 
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

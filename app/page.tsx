import { getProducts } from "@/lib/data/product"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { ProductGrid } from "@/components/landing/product-grid"
import { PromoBanners } from "@/components/landing/promo-banners"
import { StatsBanner } from "@/components/landing/stats-banner"
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
  const sp = await searchParams;
  const districtSlug = typeof sp.district === 'string' ? sp.district : undefined;

  // Fetch real products from the database with location-based pricing applied
  const rawProducts = await getProducts(districtSlug)
  
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
    showOnHomePage: p.showOnHomePage,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const categoriesToRender = [
    { key: "greens", title: "Leafy Greens", link: "/shop?category=greens" },
    { key: "vegetable", title: "Fresh Vegetables", link: "/shop?category=vegetable" },
    { key: "batter", title: "Idli & Dosa Batter", link: "/shop?category=batter" },
  ];

  return (
    <div className="flex min-h-screen flex-col w-full">
      {/* 1. Header/Navigation */}
      <Navbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <Hero />

        {/* 4. Product Grids by Category */}
        <div className="flex flex-col gap-2 md:gap-4">
          {categoriesToRender.map((cat) => {
            const catProducts = allProducts.filter(p => p.category === cat.key && p.showOnHomePage !== false).slice(0, 10);
            return catProducts.length > 0 ? (
              <ProductGrid 
                key={cat.key}
                title={cat.title} 
                products={catProducts} 
                seeAllLink={cat.link}
              />
            ) : null;
          })}
        </div>
        
        {/* 5. Promotional Banners */}
        <PromoBanners />

        {/* 5.5. Statistics Banner */}
        <StatsBanner />

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

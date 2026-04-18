import { getProducts } from "@/lib/data/product"
import { getCombosByDistrict } from "@/lib/data/combos"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { ProductGrid } from "@/components/landing/product-grid"
import { ComboGrid } from "@/components/landing/combo-grid"
import { PromoBanners } from "@/components/landing/promo-banners"
import { StatsBanner } from "@/components/landing/stats-banner"
import { InfoCards } from "@/components/landing/info-cards"
import { CallToAction } from "@/components/landing/call-to-action"
import { TrustBar } from "@/components/landing/trust-bar"
import { Footer } from "@/components/landing/footer"
import type { SerializedCombo } from "@/components/combo/ComboCard"
import { getDistrictBySlug } from "@/lib/data/location"

export const dynamic = "force-dynamic"

import { Suspense } from "react"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const districtSlug = typeof sp.district === "string" ? sp.district : undefined

  // Get district ID for price calculations
  let districtId = ""
  if (districtSlug) {
    const district = await getDistrictBySlug(districtSlug)
    districtId = district?._id.toString() ?? ""
  }

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
    isAvailable: p.isAvailable ?? true,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  // Fetch combos for the district
  const rawCombos = districtSlug ? await getCombosByDistrict(districtSlug) : []

  // Serialize combos with populated product data for ComboCard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCombos: SerializedCombo[] = rawCombos.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    isActive: c.isActive ?? true,
    pricingMode: c.pricingMode,
    fixedPrice: c.fixedPrice,
    discountPercent: c.discountPercent,
    slots: c.slots.map((slot: any) => {
      if (slot.type === "fixed") {
        return {
          type: "fixed" as const,
          productId:
            slot.productId?._id?.toString() ??
            (typeof slot.productId === "string"
              ? slot.productId
              : (slot.productId?.toString() ?? "")),
          productName: slot.productId?.name ?? "Unknown Product",
          productPrice: slot.productId?.price ?? 0,
          productImageUrl: slot.productId?.imageUrl,
          qty: slot.qty,
          customPrice: slot.customPrice,
        }
      } else {
        return {
          type: "choice" as const,
          pickCount: slot.pickCount,
          label: slot.label,
          candidateProducts: (slot.candidateProductIds ?? []).map((p: any) => ({
            productId:
              p?._id?.toString() ??
              (typeof p === "string" ? p : (p?.toString() ?? "")),
            productName:
              typeof p === "string"
                ? "Unknown Product"
                : (p?.name ?? "Unknown Product"),
            productPrice: typeof p === "string" ? 0 : (p?.price ?? 0),
            productImageUrl: typeof p === "string" ? undefined : p?.imageUrl,
          })),
        }
      }
    }),
  }))

  const categoriesToRender = [
    { key: "greens", title: "Leafy Greens", link: "/shop?category=greens" },
    {
      key: "vegetable",
      title: "Fresh Vegetables",
      link: "/shop?category=vegetable",
    },
    {
      key: "batter",
      title: "Idli & Dosa Batter",
      link: "/shop?category=batter",
    },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* 1. Header/Navigation */}
      <Navbar />

      <main className="w-full flex-1">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Combo Offers Section - Show at top if combos exist */}
        {allCombos.length > 0 && (
          <ComboGrid
            title="Combo Offers"
            combos={allCombos}
            districtId={districtId}
            seeAllLink="/shop?tab=combos"
          />
        )}

        {/* 4. Product Grids by Category */}
        <div className="flex flex-col gap-2 md:gap-4">
          {categoriesToRender.map((cat) => {
            const catProducts = allProducts
              .filter(
                (p) => p.category === cat.key && p.showOnHomePage !== false
              )
              .sort((a, b) => {
                if (a.isAvailable !== b.isAvailable)
                  return a.isAvailable ? -1 : 1
                return a.price - b.price
              })
              .slice(0, 10)
            return catProducts.length > 0 ? (
              <ProductGrid
                key={cat.key}
                title={cat.title}
                products={catProducts}
                seeAllLink={cat.link}
              />
            ) : null
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

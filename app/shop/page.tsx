import { getProducts } from "@/lib/data/product"
import { getCombosByDistrict } from "@/lib/data/combos"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { ShopClient } from "@/components/shop/shop-client"
import type { SerializedCombo } from "@/components/combo/ComboCard"
import DistrictModel from "@/lib/models/district"

export const dynamic = "force-dynamic"

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string
    search?: string
    district?: string
    tab?: string
  }>
}) {
  const sp = (await searchParams) ?? {}
  const districtSlug = sp.district
  const tab = sp.tab

  // Get district ID for price calculations
  let districtId = ""
  if (districtSlug) {
    const district = await DistrictModel.findOne({
      name: { $regex: new RegExp(`^${districtSlug}$`, "i") },
    }).lean()
    districtId = district?._id.toString() ?? ""
  }

  // Fetch products
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

  // Fetch combos for the district
  const rawCombos = districtSlug ? await getCombosByDistrict(districtSlug) : []

  // Serialize combos with populated product data for ComboCard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const combos: SerializedCombo[] = rawCombos.map((c: any) => ({
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

  const initialCategory = sp.category ?? "all"
  const initialSearch = sp.search ?? ""
  const initialTab = tab === "combos" ? "combos" : "products"

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="w-full flex-1">
        <ShopClient
          products={products}
          combos={combos}
          districtId={districtId}
          initialCategory={initialCategory}
          initialSearch={initialSearch}
          initialTab={initialTab}
        />
      </main>
      <Footer />
    </div>
  )
}

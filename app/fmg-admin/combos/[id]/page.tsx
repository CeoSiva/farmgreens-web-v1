import { notFound } from "next/navigation"
import { getComboById } from "@/lib/data/combos"
import { getProducts } from "@/lib/data/product"
import { listDistricts } from "@/lib/data/location"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ComboForm } from "@/components/admin/ComboForm"
import type { ComboSlot } from "@/lib/models/Combo"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditComboPage({ params }: Props) {
  const { id } = await params

  const [rawCombo, rawProducts, dbDistricts] = await Promise.all([
    getComboById(id),
    getProducts(undefined, true),
    listDistricts(),
  ])

  if (!rawCombo) {
    notFound()
  }

  const districts = JSON.parse(JSON.stringify(dbDistricts))

  const products = rawProducts.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: p.price,
    imageUrl: p.imageUrl,
  }))

  const combo = {
    _id: rawCombo._id.toString(),
    name: rawCombo.name,
    description: rawCombo.description ?? "",
    imageUrl: rawCombo.imageUrl ?? "",
    isActive: rawCombo.isActive ?? true,
    pricingMode: rawCombo.pricingMode,
    fixedPrice: rawCombo.fixedPrice,
    discountPercent: rawCombo.discountPercent,
    displayOrder: rawCombo.displayOrder ?? 0,
    availableInAllDistricts: rawCombo.availableInAllDistricts ?? true,
    unavailableDistricts:
      rawCombo.unavailableDistricts?.map((id: any) => id.toString()) ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slots: rawCombo.slots.map((s: ComboSlot) => ({
      ...s,
      productId:
        s.type === "fixed" ? (s as any).productId.toString() : undefined,
      candidateProductIds:
        s.type === "choice"
          ? (s as any).candidateProductIds.map((id: any) => id.toString())
          : undefined,
    })),
    createdAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawCombo.createdAt instanceof Date
        ? (rawCombo.createdAt as any).toISOString()
        : ((rawCombo.createdAt as any)?.toISOString?.() ?? ""),
    updatedAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawCombo.updatedAt instanceof Date
        ? (rawCombo.updatedAt as any).toISOString()
        : ((rawCombo.updatedAt as any)?.toISOString?.() ?? ""),
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Combo</h1>
          <p className="text-sm text-muted-foreground">
            Update combo bundle details.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/fmg-admin/combos">Cancel</Link>
          </Button>
        </div>
      </div>

      <ComboForm
        initialData={combo}
        products={products}
        districts={districts}
      />
    </div>
  )
}

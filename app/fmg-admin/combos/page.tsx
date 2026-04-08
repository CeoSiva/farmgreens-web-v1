import { getAllCombosAdmin } from "@/lib/data/combos"
import Link from "next/link"
import { CombosTable } from "@/components/admin/combos/combos-table"
import { Button } from "@/components/ui/button"
import type { ComboSlot } from "@/lib/models/Combo"

export const dynamic = "force-dynamic"

export default async function CombosAdminPage() {
  const raw = await getAllCombosAdmin()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const combos = raw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    isActive: c.isActive ?? true,
    pricingMode: c.pricingMode,
    fixedPrice: c.fixedPrice,
    discountPercent: c.discountPercent,
    displayOrder: c.displayOrder ?? 0,
    availableInAllDistricts: c.availableInAllDistricts ?? true,
    unavailableDistricts:
      c.unavailableDistricts?.map((id: any) => id.toString()) ?? [],
    slots: c.slots as ComboSlot[],
    createdAt:
      c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : (c.createdAt?.toISOString?.() ?? ""),
    updatedAt:
      c.updatedAt instanceof Date
        ? c.updatedAt.toISOString()
        : (c.updatedAt?.toISOString?.() ?? ""),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 text-foreground md:gap-8 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Combos</h1>
          <p className="text-sm text-muted-foreground">
            Manage combo bundles and meal deals.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button asChild>
            <Link href="/fmg-admin/combos/new">New Combo</Link>
          </Button>
        </div>
      </div>

      <CombosTable data={combos} />
    </div>
  )
}

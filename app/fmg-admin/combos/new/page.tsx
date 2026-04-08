import { getProducts } from "@/lib/data/product"
import { listDistricts } from "@/lib/data/location"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ComboForm } from "@/components/admin/ComboForm"

export const dynamic = "force-dynamic"

export default async function NewComboPage() {
  const [rawProducts, dbDistricts] = await Promise.all([
    getProducts(undefined, true),
    listDistricts(),
  ])

  const districts = JSON.parse(JSON.stringify(dbDistricts))

  const products = rawProducts.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: p.price,
    imageUrl: p.imageUrl,
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Combo</h1>
          <p className="text-sm text-muted-foreground">
            Create a new combo bundle.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/fmg-admin/combos">Cancel</Link>
          </Button>
        </div>
      </div>

      <ComboForm products={products} districts={districts} />
    </div>
  )
}

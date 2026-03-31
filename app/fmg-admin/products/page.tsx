import { getProducts } from "@/lib/data/product"
import { listDistricts } from "@/lib/data/location"
import { AddProductButton, BulkUploadProductsButton } from "@/components/product-actions"
import { ProductsTable } from "@/components/admin/products/products-table"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const [rawProducts, dbDistricts] = await Promise.all([
    getProducts(undefined, true),
    listDistricts()
  ])
  
  const districts = JSON.parse(JSON.stringify(dbDistricts))
  
  const products = rawProducts.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    status: p.status,
    orderQuantity: p.orderQuantity,
    customPricing: p.customPricing?.map((cp: any) => ({
      districtId: cp.districtId.toString(),
      price: cp.price,
    })) || [],
    imageUrl: p.imageUrl,
    showOnHomePage: p.showOnHomePage,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store&apos;s products and their configurations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <BulkUploadProductsButton />
          <AddProductButton districts={districts} />
        </div>
      </div>

      <ProductsTable products={products} districts={districts} />
    </div>
  )
}

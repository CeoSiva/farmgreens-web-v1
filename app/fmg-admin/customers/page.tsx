import { searchCustomers } from "@/lib/data/admin"
import { Button } from "@/components/ui/button"
import { CustomersTable } from "@/components/admin/customers/customers-table"
import { BulkUploadButton } from "@/components/admin/customers/bulk-upload-button"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CustomersAdminPage() {
  const raw = await searchCustomers("", 1000) // Increased limit for better client-side search experience

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = raw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
    mobile: `${c.countryCode ?? "+91"} ${c.mobile}`,
    addresses: c.addresses.map((addr: any) => ({
      ...addr,
      districtId: addr.districtId?.toString(),
      areaId: addr.areaId?.toString(),
    })),
    orderCount: c.orderCount,
    areaName: c.areaName,
    districtName: c.districtName,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : (c.updatedAt?.toISOString?.() ?? ""),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Customers saved from checkout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUploadButton />
          <Button asChild variant="outline">
            <Link href="/">View site</Link>
          </Button>
        </div>
      </div>

      <CustomersTable data={customers} />
    </div>
  )
}

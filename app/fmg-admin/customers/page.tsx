import Link from "next/link"

import { listCustomers } from "@/lib/data/admin"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function CustomersAdminPage() {
  const raw = await listCustomers(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customers = raw.map((c: any) => ({
    _id: c._id.toString(),
    name: c.name,
    mobile: `${c.countryCode ?? "+91"} ${c.mobile}`,
    addressCount: Array.isArray(c.addresses) ? c.addresses.length : 0,
    updatedAt: c.updatedAt?.toISOString?.() ?? "",
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
        <Button asChild variant="outline">
          <Link href="/">View site</Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Saved addresses</th>
                <th className="px-4 py-3 font-medium">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No customers yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.mobile}</td>
                    <td className="px-4 py-3">{c.addressCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

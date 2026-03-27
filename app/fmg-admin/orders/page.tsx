import Link from "next/link"

import { listRecentOrders } from "@/lib/data/admin"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function OrdersAdminPage() {
  const raw = await listRecentOrders(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = raw.map((o: any) => ({
    _id: o._id.toString(),
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    name: o.customer?.name,
    mobile: o.customer?.mobile,
    total: o.total,
    createdAt: o.createdAt?.toISOString?.() ?? "",
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Recent orders placed from the website.
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
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.name ?? "-"}</td>
                    <td className="px-4 py-3">{o.mobile ?? "-"}</td>
                    <td className="px-4 py-3">₹{Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
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

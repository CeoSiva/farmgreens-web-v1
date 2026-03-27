import { listRecentOrders } from "@/lib/data/admin"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { OrdersTable } from "@/components/admin/orders/orders-table"

export const dynamic = "force-dynamic"

export default async function OrdersAdminPage() {
  const raw = await listRecentOrders(200)

  // Serialize orders for client-side component
  const orders = JSON.parse(JSON.stringify(raw))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store orders, track deliveries and bulk update status.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/">View site</Link>
        </Button>
      </div>

      <OrdersTable data={orders} />
    </div>
  )
}

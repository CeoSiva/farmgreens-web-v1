import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { OrdersTable } from "@/components/admin/orders/orders-table"
import { getDashboardMetrics, getDashboardChartData } from "@/lib/data/dashboard"
import { listRecentOrders } from "@/lib/data/admin"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
    const rawMetrics = await getDashboardMetrics()
    const rawChartData = await getDashboardChartData(90)
    const rawOrders = await listRecentOrders(10)

    // Serialize data for client components
    const metrics = JSON.parse(JSON.stringify(rawMetrics))
    const chartData = JSON.parse(JSON.stringify(rawChartData))
    const orders = JSON.parse(JSON.stringify(rawOrders))

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 relative z-10 text-foreground">
                    <SectionCards metrics={metrics} />
                    <div className="px-4 lg:px-6">
                        <ChartAreaInteractive chartData={chartData} />
                    </div>
                    <div className="px-4 lg:px-6 mt-4">
                        <h2 className="text-xl font-semibold tracking-tight mb-4">Recent Orders</h2>
                        <OrdersTable data={orders} />
                    </div>
                </div>
            </div>
        </div>
    )
}

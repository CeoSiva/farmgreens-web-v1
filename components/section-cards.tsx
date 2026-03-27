"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon } from "lucide-react"

interface MetricsProps {
  totalRevenue: number
  ordersThisMonth: number
  newCustomers: number
  deliverySuccess: number
}

export function SectionCards({ metrics }: { metrics: MetricsProps }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue (This Month)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ₹{metrics.totalRevenue.toLocaleString("en-IN")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon className="text-primary" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Based on delivered orders{" "}
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <div className="text-muted-foreground">
            Current calendar month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.newCustomers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon className="text-primary" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registrations this month{" "}
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <div className="text-muted-foreground">
            Active user growth
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Orders This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.ordersThisMonth.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon className="text-primary" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Consistent order volume{" "}
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <div className="text-muted-foreground">Sales volume is steady</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Delivery Success</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {Math.round(metrics.deliverySuccess)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon className="text-primary" />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Deliveries completed on time{" "}
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <div className="text-muted-foreground">High fulfillment rate</div>
        </CardFooter>
      </Card>
    </div>
  )
}

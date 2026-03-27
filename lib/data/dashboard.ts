import { connectDB } from "@/lib/db"
import OrderModel from "../models/order"
import CustomerModel from "../models/customer"

export async function getDashboardMetrics() {
  await connectDB()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Total Revenue this month (delivered orders)
  const revenueResult = await OrderModel.aggregate([
    {
      $match: {
        status: "delivered",
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$total" }
      }
    }
  ])
  const totalRevenue = revenueResult[0]?.total || 0

  // Orders This Month
  const ordersThisMonth = await OrderModel.countDocuments({
    createdAt: { $gte: startOfMonth }
  })

  // New Customers This Month
  const newCustomers = await CustomerModel.countDocuments({
    createdAt: { $gte: startOfMonth }
  })

  // Delivery Success this month (delivered / non-cancelled * 100)
  const deliveredCount = await OrderModel.countDocuments({
    status: "delivered",
    createdAt: { $gte: startOfMonth }
  })
  const nonCancelledCount = await OrderModel.countDocuments({
    status: { $ne: "cancelled" },
    createdAt: { $gte: startOfMonth }
  })
  const deliverySuccess = nonCancelledCount > 0
    ? (deliveredCount / nonCancelledCount) * 100
    : 100

  return {
    totalRevenue,
    ordersThisMonth,
    newCustomers,
    deliverySuccess
  }
}

export async function getDashboardChartData(days = 90) {
  await connectDB();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const result = await OrderModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        orders: { $sum: 1 },
        sales: {
          $sum: "$total"
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Fill in missing days with zeros
  const dataMap = new Map();
  result.forEach(item => {
    dataMap.set(item._id, { orders: item.orders, sales: item.sales });
  });

  const chartData = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const data = dataMap.get(dateStr) || { orders: 0, sales: 0 };
    chartData.push({
      date: dateStr,
      orders: data.orders,
      sales: data.sales
    });
  }

  return chartData;
}

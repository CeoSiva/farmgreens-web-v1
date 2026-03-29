import { connectDB } from "../db"
import OrderModel, { IOrder } from "../models/order"
import CustomerModel, { ICustomer } from "../models/customer"

export async function listRecentOrders(limit = 50): Promise<IOrder[]> {
  await connectDB()
  return OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean()
}

export async function listCustomers(limit = 50): Promise<ICustomer[]> {
  await connectDB()
  return CustomerModel.find().sort({ updatedAt: -1 }).limit(limit).lean()
}

export async function searchCustomers(
  query: string,
  limit = 200
): Promise<any[]> {
  await connectDB()
  
  const matchStage: any = {}
  if (query.trim()) {
    const regex = new RegExp(query, "i")
    matchStage.$or = [{ name: regex }, { mobile: regex }]
  }

  return CustomerModel.aggregate([
    { $match: matchStage },
    { $sort: { updatedAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "customer.customerId",
        as: "orders",
      },
    },
    {
      $addFields: {
        orderCount: { $size: "$orders" },
        primaryAddress: {
          $ifNull: [
            { $arrayElemAt: [{ $filter: { input: "$addresses", as: "a", cond: { $eq: ["$$a.isDefault", true] } } }, 0] },
            { $arrayElemAt: ["$addresses", 0] }
          ]
        }
      },
    },
    {
      $lookup: {
        from: "areas",
        localField: "primaryAddress.areaId",
        foreignField: "_id",
        as: "areaInfo",
      },
    },
    {
      $lookup: {
        from: "districts",
        localField: "primaryAddress.districtId",
        foreignField: "_id",
        as: "districtInfo",
      },
    },
    {
      $addFields: {
        areaName: { $arrayElemAt: ["$areaInfo.name", 0] },
        districtName: { $arrayElemAt: ["$districtInfo.name", 0] },
      },
    },
    {
      $project: {
        orders: 0,
        areaInfo: 0,
        districtInfo: 0,
      },
    },
  ])
}

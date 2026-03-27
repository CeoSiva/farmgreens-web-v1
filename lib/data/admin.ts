import { connectDB } from "../db";
import OrderModel, { IOrder } from "../models/order";
import CustomerModel, { ICustomer } from "../models/customer";

export async function listRecentOrders(limit = 50): Promise<IOrder[]> {
  await connectDB();
  return OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean();
}

export async function listCustomers(limit = 50): Promise<ICustomer[]> {
  await connectDB();
  return CustomerModel.find().sort({ updatedAt: -1 }).limit(limit).lean();
}

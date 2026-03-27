import { connectDB } from "../db";
import OrderModel, { IOrder } from "../models/order";

export async function createOrder(data: Partial<IOrder>): Promise<IOrder> {
  await connectDB();
  return OrderModel.create(data);
}

export async function getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
  await connectDB();
  return OrderModel.findOne({ orderNumber }).lean();
}

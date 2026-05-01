"use server"

import { revalidatePath } from "next/cache"
import OrderModel, { OrderStatus } from "@/lib/models/order"
import { connectDB } from "@/lib/db"

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    await connectDB()
    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    )
    if (!order) return { error: "Order not found" }
    
    revalidatePath("/fmg-admin/orders")
    return { success: true }
  } catch (err) {
    console.error("Update Order Status Error:", err)
    return { error: "Failed to update order status" }
  }
}

export async function bulkUpdateOrderStatusAction(orderIds: string[], status: OrderStatus) {
  try {
    if (!orderIds || orderIds.length === 0) return { error: "No orders selected" }
    
    await connectDB()
    const result = await OrderModel.updateMany(
      { _id: { $in: orderIds } },
      { status }
    )
    
    revalidatePath("/fmg-admin/orders")
    return { success: true, modifiedCount: result.modifiedCount }
  } catch (err) {
    console.error("Bulk Update Order Status Error:", err)
    return { error: "Failed to bulk update orders" }
  }
}

export async function deleteOrderAction(orderId: string) {
  try {
    await connectDB()
    const order = await OrderModel.findByIdAndDelete(orderId)
    if (!order) return { error: "Order not found" }
    
    revalidatePath("/fmg-admin/orders")
    return { success: true }
  } catch (err) {
    console.error("Delete Order Error:", err)
    return { error: "Failed to delete order" }
  }
}

export async function bulkDeleteOrdersAction(orderIds: string[]) {
  try {
    if (!orderIds || orderIds.length === 0) return { error: "No orders selected" }
    
    await connectDB()
    const result = await OrderModel.deleteMany({ _id: { $in: orderIds } })
    
    revalidatePath("/fmg-admin/orders")
    return { success: true, deletedCount: result.deletedCount }
  } catch (err) {
    console.error("Bulk Delete Orders Error:", err)
    return { error: "Failed to bulk delete orders" }
  }
}

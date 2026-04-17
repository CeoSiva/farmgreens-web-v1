"use server"

import Razorpay from "razorpay"
import { CheckoutFormValues } from "@/lib/schemas/checkout"
import {
  CART_COOKIE_NAME,
  emptyCart,
  parseCartCookie,
  serializeCartCookie,
} from "@/lib/cart"
import type { ComboCartItem, ProductCartItem } from "@/lib/cart"
import { getProductsByIds } from "@/lib/data/product"
import { getAreaById, getDistrictById } from "@/lib/data/location"
import { upsertCustomerByMobile } from "@/lib/data/customer"
import { createOrder } from "@/lib/data/order"
import { getSettings } from "@/lib/data/setting"
import { sendOrderConfirmationWhatsApp } from "@/lib/gupshup"
import { cookies } from "next/headers"
import mongoose from "mongoose"
import crypto from "crypto"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

/** Safely converts any value to a mongoose ObjectId. */
function toObjectId(val: unknown): mongoose.Types.ObjectId {
  if (val instanceof mongoose.Types.ObjectId) return val
  if (typeof val === "object" && val !== null && "_id" in val)
    return toObjectId((val as { _id: unknown })._id)
  if (typeof val === "string") {
    try {
      return new mongoose.Types.ObjectId(val)
    } catch (err) {
      console.error(
        "[toObjectId] invalid string val:",
        JSON.stringify(val),
        "length:",
        val.length
      )
      return new mongoose.Types.ObjectId()
    }
  }
  console.error(
    "[toObjectId] UNKNOWN type:",
    typeof val,
    "value:",
    String(val),
    "constructor:",
    val?.constructor?.name
  )
  return new mongoose.Types.ObjectId()
}

function generateOrderNumber() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `FG-${y}${m}${day}-${rand}`
}

/**
 * Creates a Razorpay order by calculating total from cart
 */
export async function createRazorpayOrderAction(districtId: string) {
  try {
    const cookieStore = await cookies()
    const rawCart = cookieStore.get(CART_COOKIE_NAME)?.value
    const cart = parseCartCookie(rawCart)

    if (cart.items.length === 0) return { success: false, error: "Cart is empty" }

    // Get district for pricing
    const district = await getDistrictById(districtId)
    if (!district) return { success: false, error: "Invalid district" }

    // Separate product items (need DB lookup) from combo items (already priced)
    const productItems = cart.items.filter(
      (i): i is ProductCartItem => i.type === "product"
    )
    const comboItems = cart.items.filter(
      (i): i is ComboCartItem => i.type === "combo"
    )

    const productIds = productItems.map((i) => i.productId)
    const products = await getProductsByIds(productIds, (district as any).name)

    const byId = new Map(products.map((p: any) => [p._id.toString(), p]))

    // Calculate subtotal
    const subtotal = cart.items.reduce((acc, item) => {
      if (item.type === "combo") {
        return acc + item.finalPrice
      } else {
        const p = byId.get(item.productId)
        if (!p) return acc
        return acc + p.price * item.qty
      }
    }, 0)

    // Get settings for delivery fee calculation
    const settings = await getSettings()
    const baseDeliveryFee = Number((settings as any).deliveryFee ?? 0)
    const freeDeliveryThreshold = Number(
      (settings as any).freeDeliveryThreshold ?? 500
    )
    const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee
    const total = subtotal + deliveryFee

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(total * 100)

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        createdAt: new Date().toISOString(),
      },
    }

    const order = await razorpay.orders.create(options)

    return { success: true, orderId: order.id, amount: amountInPaise }
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return { success: false, error: "Failed to create payment order" }
  }
}

/**
 * Verifies Razorpay payment signature using the key secret
 */
export async function verifyRazorpayPaymentAction(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex")

    if (generatedSignature === razorpaySignature) {
      return { success: true }
    } else {
      return { success: false, error: "Invalid payment signature" }
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error)
    return { success: false, error: "Payment verification failed" }
  }
}

/**
 * Creates an order after successful Razorpay payment verification
 */
export async function placeOrderAfterPaymentAction(
  formData: CheckoutFormValues,
  razorpayPaymentId: string,
  razorpayOrderId: string
) {
  try {
    const cookieStore = await cookies()
    const rawCart = cookieStore.get(CART_COOKIE_NAME)?.value
    const cart = parseCartCookie(rawCart)

    if (cart.items.length === 0) return { error: "Cart is empty" }

    const district = await getDistrictById(formData.districtId)
    const area = formData.areaId ? await getAreaById(formData.areaId) : null

    if (!district) return { error: "Invalid district" }

    // Separate product items (need DB lookup) from combo items (already priced)
    const productItems = cart.items.filter(
      (i): i is ProductCartItem => i.type === "product"
    )
    const comboItems = cart.items.filter(
      (i): i is ComboCartItem => i.type === "combo"
    )

    const productIds = productItems.map((i) => i.productId)
    const products = await getProductsByIds(productIds, (district as any).name)

    const byId = new Map(products.map((p: any) => [p._id.toString(), p]))

    const items: any[] = [
      // Product line items
      ...productItems
        .map((i) => {
          const p = byId.get(i.productId)
          if (!p) return null
          return {
            itemType: "product",
            productId: p._id,
            name: p.name,
            price: p.price,
            qty: i.qty,
            unit: p.orderQuantity?.unit ?? "unit",
          }
        })
        .filter(Boolean),
      // Combo line items — finalPrice is already resolved at cart add-time
      ...comboItems.map((i) => ({
        itemType: "combo",
        comboId: toObjectId(i.comboId),
        comboName: i.comboName,
        selections: i.selections.map((s) => ({
          productId: toObjectId(s.productId),
          productName: s.productName,
          qty: s.qty,
          unitPrice: s.unitPrice,
        })),
        price: i.finalPrice,
      })),
    ]

    if (items.length === 0)
      return { error: "No valid products or combos in cart" }

    const settings = await getSettings()
    const subtotal = items.reduce((acc, it) => {
      // Combo items: price is the already-resolved total for this line
      if (it.itemType === "combo") return acc + it.price
      // Product items: multiply unit price by quantity
      return acc + it.price * it.qty
    }, 0)
    const baseDeliveryFee = Number((settings as any).deliveryFee ?? 0)
    const freeDeliveryThreshold = Number(
      (settings as any).freeDeliveryThreshold ?? 500
    )
    const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee
    const total = subtotal + deliveryFee

    let customerId: any = undefined

    if (formData.saveDetails) {
      const customer = await upsertCustomerByMobile({
        mobile: formData.mobile,
        countryCode: formData.countryCode,
        name: formData.name,
        whatsappOptIn: formData.whatsappOptIn,
        address: {
          door: formData.door,
          street: formData.street,
          districtId: formData.districtId,
          areaId: formData.areaId || undefined,
          isDefault: true,
          lat: formData.lat,
          lng: formData.lng,
        },
      })
      customerId = (customer as any)._id
    }

    const orderNumber = generateOrderNumber()

    await createOrder({
      orderNumber,
      status: "paid",
      paymentMethod: "online",
      razorpayPaymentId,
      razorpayOrderId,
      customer: {
        customerId,
        name: formData.name,
        mobile: formData.mobile,
        countryCode: formData.countryCode,
        whatsappOptIn: formData.whatsappOptIn,
      },
      shippingAddress: {
        door: formData.door,
        street: formData.street,
        districtId: formData.districtId as any,
        areaId: area ? (area as any)._id : undefined,
        districtName: (district as any).name,
        areaName: area ? (area as any).name : undefined,
        lat: formData.lat,
        lng: formData.lng,
      },
      items,
      subtotal,
      deliveryFee,
      total,
    } as any)

    // Clear cart
    cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(emptyCart()))

    // Send WhatsApp order confirmation if opted in
    if (formData.whatsappOptIn) {
      try {
        await sendOrderConfirmationWhatsApp({
          customerName: formData.name,
          customerPhone: `${formData.countryCode.replace("+", "")}${formData.mobile}`,
          orderId: orderNumber,
          items: items.map((it: any) => {
            if (it.itemType === "combo") {
              return {
                name: `${it.comboName} (Combo)`,
                qty: 1,
                price: it.price,
              }
            }
            return {
              name: it.name,
              qty: it.qty,
              price: it.price,
              unit: it.unit,
            }
          }),
          subtotal,
          shipping: deliveryFee,
          totalPaid: total,
        })
      } catch (whatsappError) {
        console.error("WhatsApp notification failed:", whatsappError)
        // Don't fail the order if WhatsApp fails
      }
    }

    return { success: true, orderNumber }
  } catch (error) {
    console.error("Error placing order after payment:", error)
    return { error: "Failed to place order after payment" }
  }
}

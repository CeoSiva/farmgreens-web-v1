"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import mongoose from "mongoose"

/** Safely converts any value to a mongoose ObjectId. Handles strings, objects with _id, and existing ObjectIds. */
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

import { CheckoutSchema, CheckoutFormValues } from "@/lib/schemas/checkout"
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

function generateOrderNumber() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `FG-${y}${m}${day}-${rand}`
}

export async function placeOrderAction(formData: CheckoutFormValues) {
  try {
    const parsed = CheckoutSchema.safeParse(formData)
    if (!parsed.success) return { error: "Invalid checkout data" }

    const cookieStore = await cookies()
    const rawCart = cookieStore.get(CART_COOKIE_NAME)?.value
    const cart = parseCartCookie(rawCart)

    if (cart.items.length === 0) return { error: "Cart is empty" }

    const district = await getDistrictById(parsed.data.districtId)
    const area = parsed.data.areaId
      ? await getAreaById(parsed.data.areaId)
      : null

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

    if (parsed.data.saveDetails) {
      const customer = await upsertCustomerByMobile({
        mobile: parsed.data.mobile,
        countryCode: parsed.data.countryCode,
        name: parsed.data.name,
        whatsappOptIn: parsed.data.whatsappOptIn,
        address: {
          door: parsed.data.door,
          street: parsed.data.street,
          districtId: parsed.data.districtId,
          areaId: parsed.data.areaId || undefined,
          isDefault: true,
        },
      })
      customerId = (customer as any)._id
    }

    const orderNumber = generateOrderNumber()

    await createOrder({
      orderNumber,
      status: "placed",
      paymentMethod: "cod",
      customer: {
        customerId,
        name: parsed.data.name,
        mobile: parsed.data.mobile,
        countryCode: parsed.data.countryCode,
        whatsappOptIn: parsed.data.whatsappOptIn,
      },
      shippingAddress: {
        door: parsed.data.door,
        street: parsed.data.street,
        districtId: parsed.data.districtId as any,
        areaId: area ? (area as any)._id : undefined,
        districtName: (district as any).name,
        areaName: area ? (area as any).name : undefined,
      },
      items,
      subtotal,
      deliveryFee,
      total,
    } as any)

    // Send WhatsApp order confirmation if opted in
    if (parsed.data.whatsappOptIn) {
      try {
        await sendOrderConfirmationWhatsApp({
          customerName: parsed.data.name,
          customerPhone: `${parsed.data.countryCode.replace("+", "")}${parsed.data.mobile}`,
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
        console.log(
          `[Gupshup] Order confirmation WhatsApp sent for order ${orderNumber}`
        )
      } catch (err) {
        console.error("[Gupshup] WhatsApp notification failed:", err)
      }
    } else {
      console.log(
        `[Gupshup] Skipped WhatsApp notification for order ${orderNumber} (User opted out)`
      )
    }

    cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(emptyCart()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })

    revalidatePath("/cart")
    revalidatePath("/checkout")

    return { success: true, orderNumber }
  } catch (err) {
    console.error("Place Order Error:", err)
    return { error: "Failed to place order" }
  }
}

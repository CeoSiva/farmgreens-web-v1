"use server"

import { cookies } from "next/headers"
import {
  CART_COOKIE_NAME,
  addItem,
  addComboToCart,
  removeComboFromCart,
  cartItemCount,
  emptyCart,
  parseCartCookie,
  removeItem,
  serializeCartCookie,
  updateItemQty,
} from "@/lib/cart"
import type { ComboCartItem } from "@/lib/cart"

async function getCartFromCookies() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(CART_COOKIE_NAME)?.value
  return { cookieStore, cart: parseCartCookie(raw) }
}

export async function getCartAction() {
  const { cart } = await getCartFromCookies()
  return { cart, itemCount: cartItemCount(cart) }
}

export async function addToCartAction(productId: string, qty = 1) {
  const { cookieStore, cart } = await getCartFromCookies()
  const next = addItem(cart, productId, qty)
  cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return { success: true, cart: next, itemCount: cartItemCount(next) }
}

export async function updateCartQtyAction(productId: string, qty: number) {
  const { cookieStore, cart } = await getCartFromCookies()
  const next = updateItemQty(cart, productId, qty)
  cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return { success: true, cart: next, itemCount: cartItemCount(next) }
}

export async function removeFromCartAction(productId: string) {
  const { cookieStore, cart } = await getCartFromCookies()
  const next = removeItem(cart, productId)
  cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return { success: true, cart: next, itemCount: cartItemCount(next) }
}

export async function clearCartAction() {
  const cookieStore = await cookies()
  const next = emptyCart()
  cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return { success: true, cart: next, itemCount: 0 }
}

export async function addComboToCartAction(item: ComboCartItem) {
  const { cookieStore, cart } = await getCartFromCookies()
  const next = addComboToCart(cart, item)
  cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return { success: true, cart: next, itemCount: cartItemCount(next) }
}

export async function removeComboFromCartAction(comboId: string) {
  const { cookieStore, cart } = await getCartFromCookies()
  const next = removeComboFromCart(cart, comboId)
  cookieStore.set(CART_COOKIE_NAME, serializeCartCookie(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  return { success: true, cart: next, itemCount: cartItemCount(next) }
}

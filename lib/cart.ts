export const CART_COOKIE_NAME = "cart"

// ─── Cart Item Types ────────────────────────────────────────────────────────────

/** A regular product in the cart. */
export type ProductCartItem = {
  type: "product"
  productId: string
  qty: number
}

/** A combo bundle in the cart — records the customer's slot selections. */
export type ComboCartItem = {
  type: "combo"
  comboId: string
  comboName: string
  imageUrl?: string
  finalPrice: number
  qty: 1 // Combos always have a quantity of 1 for now
  selections: Array<{
    slotIndex: number
    productId: string
    productName: string
    qty: number
    unitPrice: number
  }>
}

/** Discriminated union of all cart item types. */
export type CartItem = ProductCartItem | ComboCartItem

// ─── Cart Container ─────────────────────────────────────────────────────────────

export type Cart = {
  items: CartItem[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

export function normalizeQty(qty: number) {
  if (!Number.isFinite(qty)) return 1
  // Support decimals. Min 0.25, Max 99.
  // Round to 2 decimal places to avoid float issues.
  return Math.max(0.25, Math.min(99, Math.round(qty * 100) / 100))
}

export function emptyCart(): Cart {
  return { items: [] }
}

// ─── Serialisation ─────────────────────────────────────────────────────────────

export function parseCartCookie(value: string | undefined | null): Cart {
  if (!value) return emptyCart()
  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== "object") return emptyCart()

    const itemsRaw = (parsed as any).items
    if (!Array.isArray(itemsRaw)) return emptyCart()

    const items: CartItem[] = []
    for (const it of itemsRaw) {
      if (!it || typeof it !== "object") continue

      // Product item — legacy shape (no `type` field) or explicit `type: "product"`
      if ((it as any).productId !== undefined) {
        const productId = (it as any).productId
        const qty = (it as any).qty
        if (typeof productId !== "string" || productId.length === 0) continue
        if (typeof qty !== "number") continue
        items.push({ type: "product", productId, qty: normalizeQty(qty) })
        continue
      }

      // Combo item
      if ((it as any).comboId !== undefined) {
        const comboId = (it as any).comboId
        const selections = (it as any).selections
        if (typeof comboId !== "string" || comboId.length === 0) continue
        if (!Array.isArray(selections)) continue
        items.push({
          type: "combo",
          comboId,
          comboName: (it as any).comboName ?? "",
          imageUrl: (it as any).imageUrl,
          finalPrice: (it as any).finalPrice ?? 0,
          qty: 1,
          selections: selections.filter(
            (s: unknown) =>
              s &&
              typeof s === "object" &&
              typeof (s as any).productId === "string"
          ),
        })
        continue
      }
    }

    return { items }
  } catch {
    return emptyCart()
  }
}

export function serializeCartCookie(cart: Cart): string {
  return JSON.stringify({
    items: cart.items.map((i) => {
      if (i.type === "product") {
        return {
          type: "product",
          productId: i.productId,
          qty: normalizeQty(i.qty),
        }
      }
      return {
        type: "combo",
        comboId: i.comboId,
        comboName: i.comboName,
        imageUrl: i.imageUrl,
        finalPrice: i.finalPrice,
        qty: 1,
        selections: i.selections,
      }
    }),
  })
}

// ─── Product Cart Functions (unchanged) ─────────────────────────────────────────

export function addItem(cart: Cart, productId: string, qty = 1): Cart {
  const nextQty = normalizeQty(qty)
  const existing = cart.items.find(
    (i) => i.type === "product" && i.productId === productId
  )
  if (existing && existing.type === "product") {
    return {
      items: cart.items.map((i) =>
        i.type === "product" && i.productId === productId
          ? { ...i, qty: normalizeQty(i.qty + nextQty) }
          : i
      ),
    }
  }
  return {
    items: [...cart.items, { type: "product", productId, qty: nextQty }],
  }
}

export function updateItemQty(
  cart: Cart,
  productId: string,
  qty: number
): Cart {
  if (qty <= 0) {
    return {
      items: cart.items.filter(
        (i) => !(i.type === "product" && i.productId === productId)
      ),
    }
  }
  const nextQty = normalizeQty(qty)
  return {
    items: cart.items.map((i) =>
      i.type === "product" && i.productId === productId
        ? { ...i, qty: nextQty }
        : i
    ),
  }
}

export function removeItem(cart: Cart, productId: string): Cart {
  return {
    items: cart.items.filter(
      (i) => !(i.type === "product" && i.productId === productId)
    ),
  }
}

export function cartItemCount(cart: Cart): number {
  return cart.items.length
}

// ─── Combo Cart Functions ──────────────────────────────────────────────────────

/**
 * Adds a combo to the cart (or replaces it if already present).
 * A combo is always qty 1 — re-adding updates the selections.
 */
export function addComboToCart(cart: Cart, item: ComboCartItem): Cart {
  // Remove any existing entry for this combo
  const without = cart.items.filter(
    (i) => !(i.type === "combo" && i.comboId === item.comboId)
  )
  return { items: [...without, item] }
}

/**
 * Removes a combo from the cart by its comboId.
 */
export function removeComboFromCart(cart: Cart, comboId: string): Cart {
  return {
    items: cart.items.filter(
      (i) => !(i.type === "combo" && i.comboId === comboId)
    ),
  }
}

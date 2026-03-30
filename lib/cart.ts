export const CART_COOKIE_NAME = "cart";

export type CartItem = {
  productId: string;
  qty: number;
};

export type Cart = {
  items: CartItem[];
};

export function normalizeQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  // Support decimals. Min 0.25, Max 99.
  // Round to 2 decimal places to avoid float issues.
  return Math.max(0.25, Math.min(99, Math.round(qty * 100) / 100));
}

export function emptyCart(): Cart {
  return { items: [] };
}

export function parseCartCookie(value: string | undefined | null): Cart {
  if (!value) return emptyCart();
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return emptyCart();

    const itemsRaw = (parsed as any).items;
    if (!Array.isArray(itemsRaw)) return emptyCart();

    const items: CartItem[] = [];
    for (const it of itemsRaw) {
      if (!it || typeof it !== "object") continue;
      const productId = (it as any).productId;
      const qty = (it as any).qty;
      if (typeof productId !== "string" || productId.length === 0) continue;
      if (typeof qty !== "number") continue;
      items.push({ productId, qty: normalizeQty(qty) });
    }

    return { items };
  } catch {
    return emptyCart();
  }
}

export function serializeCartCookie(cart: Cart): string {
  return JSON.stringify({
    items: cart.items.map((i) => ({
      productId: i.productId,
      qty: normalizeQty(i.qty),
    })),
  });
}

export function addItem(cart: Cart, productId: string, qty = 1): Cart {
  const nextQty = normalizeQty(qty);
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    return {
      items: cart.items.map((i) =>
        i.productId === productId ? { ...i, qty: normalizeQty(i.qty + nextQty) } : i
      ),
    };
  }
  return { items: [...cart.items, { productId, qty: nextQty }] };
}

export function updateItemQty(cart: Cart, productId: string, qty: number): Cart {
  if (qty <= 0) {
    return { items: cart.items.filter((i) => i.productId !== productId) };
  }
  const nextQty = normalizeQty(qty);
  return {
    items: cart.items.map((i) =>
      i.productId === productId ? { ...i, qty: nextQty } : i
    ),
  };
}

export function removeItem(cart: Cart, productId: string): Cart {
  return { items: cart.items.filter((i) => i.productId !== productId) };
}

export function cartItemCount(cart: Cart): number {
  return cart.items.length;
}

"use client"

import Image from "next/image"
import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { useMemo, useTransition } from "react"
import { toast } from "sonner"

import type { Cart, CartItem, ComboCartItem, ProductCartItem } from "@/lib/cart"
import type { SerializedProduct } from "@/components/landing/product-card"
import {
  removeFromCartAction,
  updateCartQtyAction,
  clearCartAction,
  removeComboFromCartAction,
} from "@/server/actions/cart"
import { Minus, Plus, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { formatQuantity } from "@/lib/utils/format"
import { useCart } from "./cart-context"

export function CartClient({
  cart,
  products,
  deliveryFee,
  freeDeliveryThreshold,
}: {
  cart: Cart
  products: SerializedProduct[]
  deliveryFee: number
  freeDeliveryThreshold: number
}) {
  const [isPending, startTransition] = useTransition()
  const { updateCart } = useCart()

  const byId = useMemo(() => {
    return new Map(products.map((p) => [p._id, p]))
  }, [products])

  // Separate product items and combo items
  const productItems = cart.items.filter(
    (item): item is ProductCartItem => item.type === "product"
  )
  const comboItems = cart.items.filter(
    (item): item is ComboCartItem => item.type === "combo"
  )

  const productRows = productItems
    .map((item) => {
      const p = byId.get(item.productId)
      if (!p) return null
      return { item, product: p }
    })
    .filter(Boolean) as {
      item: ProductCartItem
      product: SerializedProduct
    }[]

  const subtotal = productRows.reduce(
    (acc, r) => acc + r.product.price * r.item.qty,
    0
  ) + comboItems.reduce((acc, c) => acc + c.finalPrice, 0)

  const effectiveDeliveryFee = subtotal >= freeDeliveryThreshold ? 0 : deliveryFee
  const total = subtotal + effectiveDeliveryFee
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal)

  const updateQty = (productId: string, qty: number) => {
    startTransition(async () => {
      try {
        const res = await updateCartQtyAction(productId, qty)
        if ((res as any)?.success) {
          toast.success("Cart updated")
          updateCart((res as any).cart.items)
        } else toast.error("Failed to update cart")
      } catch {
        toast.error("Failed to update cart")
      }
    })
  }

  const removeProduct = (productId: string) => {
    startTransition(async () => {
      try {
        const res = await removeFromCartAction(productId)
        if ((res as any)?.success) {
          toast.success("Removed from cart")
          updateCart((res as any).cart.items)
        } else toast.error("Failed to remove")
      } catch {
        toast.error("Failed to remove")
      }
    })
  }

  const removeCombo = (comboId: string) => {
    startTransition(async () => {
      try {
        const res = await removeComboFromCartAction(comboId)
        if ((res as any)?.success) {
          toast.success("Removed combo from cart")
          updateCart((res as any).cart.items)
        } else toast.error("Failed to remove combo")
      } catch {
        toast.error("Failed to remove combo")
      }
    })
  }

  const clear = () => {
    startTransition(async () => {
      try {
        const res = await clearCartAction()
        if ((res as any)?.success) {
          toast.success("Cart cleared")
          updateCart([])
        } else toast.error("Failed to clear")
      } catch {
        toast.error("Failed to clear")
      }
    })
  }

  const isEmpty = productRows.length === 0 && comboItems.length === 0

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        <p>Your cart is empty.</p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Combo Items */}
      {comboItems.length > 0 && (
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Combo Offers</h3>
          {comboItems.map((combo) => (
            <Card key={combo.comboId} className="p-4 border-primary/20 bg-primary/5">
              <div className="flex gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white shrink-0">
                  <Image
                    src={combo.imageUrl || "/placeholder-hero.png"}
                    alt={combo.comboName}
                    fill
                    className="object-contain p-1"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="leading-tight font-medium">{combo.comboName}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {combo.selections.map((s, idx) => (
                          <span key={idx} className="block">
                            • {s.productName} × {s.qty}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-right whitespace-nowrap">
                      ₹{combo.finalPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Qty: 1</span>
                    <Button
                      variant="ghost"
                      className="text-destructive h-auto py-1 px-2 text-xs"
                      onClick={() => removeCombo(combo.comboId)}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Product Items */}
      {productRows.length > 0 && (
        <div className="grid gap-3">
          {comboItems.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground pt-2">Products</h3>
          )}
          {productRows.map(({ item, product }) => {
            const imageUrl = product.imageUrl || "/placeholder-hero.png"
            return (
              <Card key={product._id} className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white shrink-0">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="leading-tight font-medium">
                          {product.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground capitalize">
                          {product.category}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-right whitespace-nowrap">
                        <span className="text-xs font-normal text-muted-foreground block">
                          ₹{product.price} x {formatQuantity(item.qty, product.orderQuantity.unit)}
                        </span>
                        ₹{(product.price * item.qty).toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center">
                        {(() => {
                          const isKg = product.orderQuantity.unit.toLowerCase() === "kg"
                          const step = isKg ? 0.25 : 1
                          const min = isKg ? 0.25 : 1

                          return (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() =>
                                  updateQty(product._id, Math.max(min, item.qty - step))
                                }
                                disabled={isPending || item.qty <= min}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                className="h-8 w-14 [appearance:textfield] rounded-none border-x-0 text-center text-xs font-bold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                type="number"
                                step={step}
                                min={min}
                                max={99}
                                value={item.qty}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  if (val >= min && val <= 99) updateQty(product._id, val)
                                }}
                                disabled={isPending}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() =>
                                  updateQty(product._id, Math.min(99, item.qty + step))
                                }
                                disabled={isPending || item.qty >= 99}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          )
                        })()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeProduct(product._id)}
                          disabled={isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-4 outline outline-green-500 bg-green-50">
        <div className="flex items-center justify-center">
          <p className="text-md font-bold text-green-700">Free delivery on orders above ₹{freeDeliveryThreshold}</p>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Delivery fee</span>
          <span className="font-medium">
            {effectiveDeliveryFee === 0 ? "Free" : `₹${effectiveDeliveryFee.toFixed(2)}`}
          </span>
        </div>

        {/* Free Delivery Upsell Message */}
        {amountToFreeDelivery > 0 ? (
          <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            Add <span className="font-bold">₹{amountToFreeDelivery.toFixed(0)}</span> more to unlock <strong>Free Delivery!</strong>
          </div>
        ) : (
          <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
            Yay! You&apos;ve unlocked <strong>Free Delivery!</strong> 🎉
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-semibold text-lg">₹{total.toFixed(2)}</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={clear} disabled={isPending}>
            Clear cart
          </Button>
          <Button asChild disabled={isPending}>
            <Link href="/checkout">Proceed to checkout</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

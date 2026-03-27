"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useTransition } from "react"
import { toast } from "sonner"

import type { Cart } from "@/lib/cart"
import type { SerializedProduct } from "@/components/landing/product-card"
import {
  removeFromCartAction,
  updateCartQtyAction,
  clearCartAction,
} from "@/server/actions/cart"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export function CartClient({
  cart,
  products,
  deliveryFee,
}: {
  cart: Cart
  products: SerializedProduct[]
  deliveryFee: number
}) {
  const [isPending, startTransition] = useTransition()

  const byId = useMemo(() => {
    return new Map(products.map((p) => [p._id, p]))
  }, [products])

  const rows = cart.items
    .map((i) => {
      const p = byId.get(i.productId)
      if (!p) return null
      return { item: i, product: p }
    })
    .filter(Boolean) as {
    item: { productId: string; qty: number }
    product: SerializedProduct
  }[]
  const subtotal = rows.reduce(
    (acc, r) => acc + r.product.price * r.item.qty,
    0
  )
  const total = subtotal + deliveryFee

  const updateQty = (productId: string, qty: number) => {
    startTransition(async () => {
      try {
        const res = await updateCartQtyAction(productId, qty)
        if ((res as any)?.success) toast.success("Cart updated")
        else toast.error("Failed to update cart")
      } catch {
        toast.error("Failed to update cart")
      }
    })
  }

  const remove = (productId: string) => {
    startTransition(async () => {
      try {
        const res = await removeFromCartAction(productId)
        if ((res as any)?.success) toast.success("Removed from cart")
        else toast.error("Failed to remove")
      } catch {
        toast.error("Failed to remove")
      }
    })
  }

  const clear = () => {
    startTransition(async () => {
      try {
        const res = await clearCartAction()
        if ((res as any)?.success) toast.success("Cart cleared")
        else toast.error("Failed to clear")
      } catch {
        toast.error("Failed to clear")
      }
    })
  }

  if (rows.length === 0) {
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
      <div className="grid gap-3">
        {rows.map(({ item, product }) => {
          const imageUrl = product.imageUrl || "/placeholder-hero.png"
          return (
            <Card key={product._id} className="p-4">
              <div className="flex gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white">
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
                    <div className="text-sm font-semibold">
                      ₹{product.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={() =>
                          updateQty(product._id, Math.max(1, item.qty - 1))
                        }
                        disabled={isPending || item.qty <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        className="h-8 w-12 [appearance:textfield] rounded-none border-x-0 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        type="number"
                        min={1}
                        max={99}
                        value={item.qty}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          if (val >= 1 && val <= 99) updateQty(product._id, val)
                        }}
                        disabled={isPending}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={() =>
                          updateQty(product._id, Math.min(99, item.qty + 1))
                        }
                        disabled={isPending || item.qty >= 99}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => remove(product._id)}
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

      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Delivery fee</span>
          <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">₹{total.toFixed(2)}</span>
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

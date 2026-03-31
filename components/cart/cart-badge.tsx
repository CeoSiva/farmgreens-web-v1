"use client"

import { useEffect, useState } from "react"
import { useLocationRouter } from "@/hooks/use-location-router"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart/cart-context"

export function CartBadge() {
  const router = useLocationRouter()
  const { items } = useCart()
  const count = items.length

  return (
    <Button
      onClick={() => router.push("/cart")}
      variant="ghost"
      size="icon"
      className="relative text-foreground"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="sr-only">Cart</span>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  )
}

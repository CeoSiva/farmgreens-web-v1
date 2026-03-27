"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCartAction } from "@/server/actions/cart"

export function CartBadge() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    getCartAction().then((res) => setCount(res.itemCount))

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail?.itemCount === "number") {
        setCount(detail.itemCount)
      } else {
        getCartAction().then((res) => setCount(res.itemCount))
      }
    }

    window.addEventListener("cart-updated", onUpdate)
    return () => window.removeEventListener("cart-updated", onUpdate)
  }, [])

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

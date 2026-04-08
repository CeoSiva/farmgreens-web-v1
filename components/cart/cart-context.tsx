"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { CartItem } from "@/lib/cart"

interface CartContextType {
  items: CartItem[]
  isInCart: (productId: string) => boolean
  updateCart: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({
  children,
  initialItems = [],
}: {
  children: React.ReactNode
  initialItems?: CartItem[]
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems)

  const updateCart = useCallback((newItems: CartItem[]) => {
    setItems(newItems)
  }, [])

  const isInCart = useCallback(
    (productId: string) => {
      return items.some(
        (item) => item.type === "product" && item.productId === productId
      )
    },
    [items]
  )

  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      // If we have full items in the event, use them, otherwise we might need a fetch or rely on the server action response
      if (event.detail?.items) {
        setItems(event.detail.items)
      } else if (event.detail?.itemCount === 0) {
        setItems([])
      }
      // Note: In most cases, the product card or other components will dispatch this event with the new state.
    }

    window.addEventListener("cart-updated" as any, handleCartUpdate)
    return () =>
      window.removeEventListener("cart-updated" as any, handleCartUpdate)
  }, [])

  return (
    <CartContext.Provider value={{ items, isInCart, updateCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

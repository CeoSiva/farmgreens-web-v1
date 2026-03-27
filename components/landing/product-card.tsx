"use client"

import Image from "next/image"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { addToCartAction, clearCartAction } from "@/server/actions/cart"
import { useCart } from "@/components/cart/cart-context"
import { cn } from "@/lib/utils"

export interface SerializedProduct {
  _id: string
  name: string
  category: string
  description?: string
  price: number
  status: string
  orderQuantity: {
    type: string
    unit: string
  }
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

interface ProductCardProps {
  product: SerializedProduct
}

export function ProductCard({ product }: ProductCardProps) {
  // Use a fallback image if none provided
  const imageUrl = product.imageUrl || "/placeholder-hero.png" // Temporary fallback

  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { isInCart, updateCart } = useCart()
  const inCart = isInCart(product._id)

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        const res = await addToCartAction(product._id, 1)
        if ((res as any)?.success) {
          toast.success("Added to cart")
          // Update global context
          updateCart((res as any).cart.items)
          // Maintain legacy event for other components (like navbar badge)
          window.dispatchEvent(
            new CustomEvent("cart-updated", {
              detail: { 
                itemCount: (res as any).itemCount,
                items: (res as any).cart.items 
              },
            })
          )
        } else toast.error("Failed to add to cart")
      } catch {
        toast.error("Failed to add to cart")
      }
    })
  }

  const handleBuyNow = () => {
    startTransition(async () => {
      try {
        await clearCartAction()
        const res = await addToCartAction(product._id, 1)
        if ((res as any)?.success) {
          // Update global context
          updateCart((res as any).cart.items)
          
          window.dispatchEvent(
            new CustomEvent("cart-updated", {
              detail: { 
                itemCount: (res as any).itemCount,
                items: (res as any).cart.items
              },
            })
          )
          router.push("/checkout")
        } else {
          toast.error("Failed to start checkout")
        }
      } catch {
        toast.error("Failed to start checkout")
      }
    })
  }

  return (
    <Card className="group flex flex-col relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:shadow-md p-0 gap-0">

      {/* Product Image Area - Full Bleed */}
      <div className="relative h-48 w-full overflow-hidden bg-muted/20 md:h-56">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>

      <CardContent className="flex flex-1 flex-col p-4 md:p-5">
        {/* Content Area */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold md:text-base">
              {product.name}
            </h3>
            <span className="text-sm font-bold">
              ₹{product.price.toFixed(2)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(120)</span>
          </div>

          <div className="mt-2 mb-4 text-xs text-muted-foreground">
            <span className="mr-1 font-medium capitalize">
              {product.orderQuantity.type}:
            </span>
            1 {product.orderQuantity.unit}
            {product.description && (
              <span className="mt-1 line-clamp-2">{product.description}</span>
            )}
          </div>

          <div className="mt-auto pt-2">
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
              <Button
                variant={inCart ? "secondary" : "outline"}
                className={cn(
                  "w-full rounded-lg text-sm transition-all",
                  inCart 
                    ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                    : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                )}
                onClick={handleAddToCart}
                disabled={isPending}
              >
                {inCart ? "Added ✅" : "Add to Cart"}
              </Button>
              <Button
                className="w-full rounded-lg text-sm"
                onClick={handleBuyNow}
                disabled={isPending}
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

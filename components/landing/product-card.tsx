"use client"

import Image from "next/image"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { addToCartAction, clearCartAction } from "@/server/actions/cart"

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

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        const res = await addToCartAction(product._id, 1)
        if ((res as any)?.success) {
          toast.success("Added to cart")
          window.dispatchEvent(
            new CustomEvent("cart-updated", {
              detail: { itemCount: (res as any).itemCount },
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
          window.dispatchEvent(
            new CustomEvent("cart-updated", {
              detail: { itemCount: (res as any).itemCount },
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
    <Card className="group relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/50 text-muted-foreground hover:bg-white hover:text-red-500 hover:shadow-sm"
      >
        <Heart className="h-4 w-4" />
        <span className="sr-only">Add to wishlist</span>
      </Button>

      <CardContent className="flex h-full flex-col p-4 md:p-5">
        {/* Product Image Area */}
        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-white md:h-48">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>

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
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full rounded-lg border-primary/20 bg-primary/5 text-sm text-primary transition-colors hover:bg-primary/10"
                onClick={handleAddToCart}
                disabled={isPending}
              >
                Add to Cart
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

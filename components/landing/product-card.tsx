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
          updateCart((res as any).cart.items)
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
    <>
      {/* MOBILE / ZEPTO STYLE CARD (Visible only on mobile) */}
      <Card className="md:hidden group flex flex-col relative overflow-hidden rounded-xl border border-border/50 bg-background shadow-xs transition-all duration-200 hover:shadow-md p-0 gap-0">
        <div className="absolute top-0 right-0 z-10 rounded-bl-xl bg-orange-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          FRESH
        </div>

        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        <CardContent className="flex flex-1 flex-col p-3">
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground min-h-[32px]">
              {product.name}
            </h3>
            <span className="text-[11px] font-medium text-muted-foreground">
              {product.orderQuantity.type === "count" ? "1 piece" : `1 ${product.orderQuantity.unit}`}
            </span>
          </div>

          <div className="mt-auto pt-3 flex items-end justify-between">
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-muted-foreground line-through">
                ₹{(product.price * 1.1).toFixed(0)}
              </span>
              <span className="text-sm font-bold text-foreground">
                ₹{product.price.toFixed(0)}
              </span>
            </div>

            <Button
              variant={inCart ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 min-w-[64px] rounded-md px-3 text-xs font-bold transition-all shadow-sm",
                inCart
                  ? "bg-green-600 text-white hover:bg-green-700 border-green-600"
                  : "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60"
              )}
              onClick={handleAddToCart}
              disabled={isPending}
            >
              {inCart ? "ADDED" : "ADD"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DESKTOP / ORIGINAL STYLE CARD (Visible only on tablet and desktop) */}
      <Card className="hidden md:flex group flex-col relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:shadow-md p-0 gap-0">
        <div className="relative md:h-56 lg:h-64 w-full overflow-hidden bg-muted/20">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1200px) 33vw, 25vw"
          />
        </div>

        <CardContent className="flex flex-1 flex-col p-5">
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-base font-semibold">
                {product.name}
              </h3>
              <span className="text-lg font-bold">
                ₹{product.price.toFixed(0)}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">(120)</span>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              <span className="mr-1 font-medium capitalize">
                {product.orderQuantity.type}:
              </span>
              1 {product.orderQuantity.unit}
              {product.description && (
                <span className="mt-1.5 block line-clamp-2 leading-relaxed">{product.description}</span>
              )}
            </div>

            <div className="mt-auto pt-5">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={inCart ? "secondary" : "outline"}
                  className={cn(
                    "w-full rounded-lg text-sm transition-all",
                    inCart 
                      ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                      : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary"
                  )}
                  onClick={handleAddToCart}
                  disabled={isPending}
                >
                  {inCart ? "Added ✅" : "Add to Cart"}
                </Button>
                <Button
                  className="w-full rounded-lg text-sm shadow-sm"
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
    </>
  )
}

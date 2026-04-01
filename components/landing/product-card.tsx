"use client"

import Image from "next/image"
import { Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTransition } from "react"
import { toast } from "sonner"
import { useLocationRouter } from "@/hooks/use-location-router"
import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { addToCartAction, clearCartAction } from "@/server/actions/cart"
import { useCart } from "@/components/cart/cart-context"
import { cn } from "@/lib/utils"
import { formatQuantity } from "@/lib/utils/format"



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
  const router = useLocationRouter()

  const { isInCart, updateCart } = useCart()
  const inCart = isInCart(product._id)

  // Default quantity logic: 250g for kg products, 1 unit/piece otherwise
  const isKgProduct = product.orderQuantity.unit.toLowerCase() === "kg"
  const defaultQty = isKgProduct ? 0.25 : 1
  const displayPrice = product.price * defaultQty
  const displayQuantityText = product.orderQuantity.type === "count" 
    ? "1 piece" 
    : formatQuantity(defaultQty, product.orderQuantity.unit)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      try {
        const res = await addToCartAction(product._id, defaultQty)
        if ((res as any)?.success) {
          toast.success(`Added ${product.name} to cart`, {
            action: {
              label: "Go to Cart",
              onClick: () => router.push("/cart"),
            },
          })
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

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      try {
        await clearCartAction()
        const res = await addToCartAction(product._id, defaultQty)
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
      <Link href={`/product/${product._id}`} className="md:hidden block">
        <Card className="group flex flex-col relative overflow-hidden rounded-xl border border-border/50 bg-background shadow-xs transition-all duration-200 hover:shadow-md p-0 gap-0">
        <div className="absolute top-0 right-0 z-10 rounded-bl-lg bg-orange-500/90 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
          FRESH
        </div>

        <div className="relative h-28 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        <CardContent className="flex flex-1 flex-col p-2 pt-1.5">
          <div className="flex flex-1 flex-col gap-0.5">
            <h3 className="line-clamp-2 text-[10px] font-bold leading-tight text-foreground min-h-[26px]">
              {product.name}
            </h3>
              <span className="text-[9px] font-medium text-muted-foreground">
                {displayQuantityText}
              </span>
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between gap-1">
            <div className="flex flex-col leading-none">
              <span className="text-[8px] text-muted-foreground line-through">
                ₹{(displayPrice * 1.1).toFixed(0)}
              </span>
              <span className="text-xs font-black text-foreground">
                ₹{displayPrice.toFixed(0)}
              </span>
            </div>

            <Button
              variant={inCart ? "default" : "default"}
              size="sm"
              className={cn(
                "h-7 min-w-[48px] rounded-md px-2 text-[9px] font-black transition-all shadow-sm",
                inCart
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={handleAddToCart}
              disabled={isPending}
            >
              {inCart ? "ADDED" : "ADD"}
            </Button>
          </div>
        </CardContent>
        </Card>
      </Link>

      {/* DESKTOP / ORIGINAL STYLE CARD (Visible only on tablet and desktop) */}
      <Link href={`/product/${product._id}`} className="hidden md:block">
        <Card className="flex group flex-col relative overflow-hidden rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:shadow-md p-0 gap-0">
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
                ₹{displayPrice.toFixed(0)}
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
              {displayQuantityText}
              {product.description && (
                <span className="mt-1.5 block line-clamp-2 leading-relaxed">{product.description}</span>
              )}
            </div>

            <div className="mt-auto pt-5">
              <Button
                variant="default"
                className={cn(
                  "w-full h-11 rounded-xl text-sm font-bold transition-all shadow-md",
                  inCart 
                    ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleAddToCart}
                disabled={isPending}
              >
                {inCart ? "Added ✅" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
      </Link>
    </>
  )
}

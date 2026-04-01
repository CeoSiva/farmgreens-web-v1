"use client"

import Image from "next/image"
import { ArrowLeft, Star, ShoppingCart, Zap, ShieldCheck, Leaf, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTransition } from "react"
import { toast } from "sonner"
import { useLocationRouter } from "@/hooks/use-location-router"
import { addToCartAction, clearCartAction } from "@/server/actions/cart"
import { useCart } from "@/components/cart/cart-context"
import { cn } from "@/lib/utils"
import { formatQuantity } from "@/lib/utils/format"
import { SerializedProduct } from "@/components/landing/product-card"

interface ProductDetailClientProps {
  product: SerializedProduct
}

const categoryLabels: Record<string, string> = {
  greens: "Leafy Greens",
  vegetable: "Vegetables",
  batter: "Batter",
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const imageUrl = product.imageUrl || "/placeholder-hero.png"
  const [isPending, startTransition] = useTransition()
  const router = useLocationRouter()
  const { isInCart, updateCart } = useCart()
  const inCart = isInCart(product._id)

  const isKgProduct = product.orderQuantity.unit.toLowerCase() === "kg"
  const defaultQty = isKgProduct ? 0.25 : 1
  const displayPrice = product.price * defaultQty
  const strikePrice = displayPrice * 1.1
  const displayQuantityText =
    product.orderQuantity.type === "count"
      ? "1 piece"
      : formatQuantity(defaultQty, product.orderQuantity.unit)

  const handleAddToCart = () => {
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
              detail: { itemCount: (res as any).itemCount, items: (res as any).cart.items },
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
        const res = await addToCartAction(product._id, defaultQty)
        if ((res as any)?.success) {
          updateCart((res as any).cart.items)
          window.dispatchEvent(
            new CustomEvent("cart-updated", {
              detail: { itemCount: (res as any).itemCount, items: (res as any).cart.items },
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
    <div className="min-h-screen bg-background">
      {/* Back button header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md md:px-6">
        <button
          onClick={() => router.push("/shop")}
          className="flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Shop</span>
        </button>
        <span className="text-xs text-muted-foreground/50">/</span>
        <span className="line-clamp-1 text-sm font-medium text-foreground">{product.name}</span>
      </div>

      {/* ======== MOBILE LAYOUT (below md) ======== */}
      <div className="md:hidden">
        {/* Product image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* FRESH badge */}
          <div className="absolute left-3 top-3 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
            🌿 FRESH
          </div>
        </div>

        {/* Product info */}
        <div className="px-4 py-4 pb-32">
          <Badge variant="secondary" className="mb-2 text-xs">
            {categoryLabels[product.category] ?? product.category}
          </Badge>

          <h1 className="text-xl font-bold leading-tight text-foreground">{product.name}</h1>

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">4.9 (120 reviews)</span>
          </div>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">₹{displayPrice.toFixed(0)}</span>
            <span className="text-sm text-muted-foreground line-through">₹{strikePrice.toFixed(0)}</span>
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              10% OFF
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Per {displayQuantityText}
          </p>

          {/* Description */}
          {product.description && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-foreground">About this product</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { icon: Leaf, label: "Farm Fresh" },
              { icon: ShieldCheck, label: "Quality Checked" },
              { icon: Clock, label: "Same Day Delivery" },
              { icon: Zap, label: "Fast Dispatch" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky CTA bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-11 rounded-xl font-bold gap-2 border-primary text-primary hover:bg-primary/10",
                inCart && "border-muted text-muted-foreground hover:bg-muted/50"
              )}
              onClick={handleAddToCart}
              disabled={isPending}
            >
              <ShoppingCart className="h-4 w-4" />
              {inCart ? "Added ✅" : "Add to Cart"}
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              onClick={handleBuyNow}
              disabled={isPending}
            >
              <Zap className="h-4 w-4" />
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* ======== DESKTOP LAYOUT (md and above) ======== */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <div className="grid grid-cols-2 gap-10 lg:gap-16">
            {/* Left: Image */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted/20 shadow-md">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 1200px) 50vw, 600px"
                  priority
                />
                <div className="absolute left-4 top-4 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                  🌿 FRESH TODAY
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col">
              <Badge variant="secondary" className="mb-3 w-fit text-xs">
                {categoryLabels[product.category] ?? product.category}
              </Badge>

              <h1 className="text-3xl font-bold leading-tight text-foreground lg:text-4xl">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9 (120 reviews)</span>
              </div>

              {/* Price */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-black text-foreground">₹{displayPrice.toFixed(0)}</span>
                <span className="text-lg text-muted-foreground line-through">₹{strikePrice.toFixed(0)}</span>
                <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  10% OFF
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Per {displayQuantityText}</p>

              {/* Description */}
              {product.description ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-foreground">About this product</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{product.description}</p>
                </div>
              ) : (
                <p className="mt-6 leading-relaxed text-muted-foreground">
                  Farm-fresh {product.name.toLowerCase()} harvested daily and delivered straight to your door. 
                  Rich in nutrients, sourced sustainably.
                </p>
              )}

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {[
                  { icon: Leaf, label: "100% Farm Fresh" },
                  { icon: ShieldCheck, label: "Quality Guaranteed" },
                  { icon: Clock, label: "Same Day Delivery" },
                  { icon: Zap, label: "Quickly Dispatched" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3.5 py-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-8 flex gap-3">
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-12 rounded-xl font-bold gap-2 text-base border-primary text-primary hover:bg-primary/10",
                    inCart && "border-muted text-muted-foreground hover:bg-muted/50"
                  )}
                  onClick={handleAddToCart}
                  disabled={isPending}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {inCart ? "Added ✅" : "Add to Cart"}
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-bold gap-2 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                  onClick={handleBuyNow}
                  disabled={isPending}
                >
                  <Zap className="h-5 w-5" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTransition } from "react"
import { toast } from "sonner"
import { useLocationRouter } from "@/hooks/use-location-router"
import { addComboToCartAction } from "@/server/actions/cart"
import { useCart } from "@/components/cart/cart-context"
import { ComboPickerModal } from "./ComboPickerModal"
import { formatQuantity } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SerializedComboSlotFixed {
  type: "fixed"
  productId: string
  productName: string
  productPrice: number
  productImageUrl?: string
  qty: number
  customPrice?: number
}

export interface SerializedComboSlotChoice {
  type: "choice"
  pickCount: number
  label?: string
  candidateProducts: Array<{
    productId: string
    productName: string
    productPrice: number
    productImageUrl?: string
  }>
}

export type SerializedComboSlot =
  | SerializedComboSlotFixed
  | SerializedComboSlotChoice

export interface SerializedCombo {
  _id: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  pricingMode: "fixed" | "percent_discount" | "per_item"
  fixedPrice?: number
  discountPercent?: number
  slots: SerializedComboSlot[]
}

interface ComboCardProps {
  combo: SerializedCombo
  districtId: string
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

function calculateComboPrice(
  combo: SerializedCombo,
  districtId: string
): {
  original: number
  current: number
  hasDiscount: boolean
} {
  const slots = combo.slots

  if (combo.pricingMode === "fixed" && combo.fixedPrice !== undefined) {
    return {
      original: slots.reduce((sum, s) => {
        if (s.type === "fixed") {
          const price = s.customPrice ?? s.productPrice
          return sum + price * s.qty
        }
        // For choice slots, use the cheapest product * pickCount
        if (s.type === "choice") {
          const cheapest = Math.min(
            ...s.candidateProducts.map((p) => p.productPrice)
          )
          return sum + cheapest * s.pickCount
        }
        return sum
      }, 0),
      current: combo.fixedPrice,
      hasDiscount:
        combo.fixedPrice <
        slots.reduce((sum, s) => {
          if (s.type === "fixed") {
            return sum + s.productPrice * s.qty
          }
          if (s.type === "choice") {
            const cheapest = Math.min(
              ...s.candidateProducts.map((p) => p.productPrice)
            )
            return sum + cheapest * s.pickCount
          }
          return sum
        }, 0),
    }
  }

  if (
    combo.pricingMode === "percent_discount" &&
    combo.discountPercent !== undefined
  ) {
    const original = slots.reduce((sum, s) => {
      if (s.type === "fixed") {
        return sum + s.productPrice * s.qty
      }
      if (s.type === "choice") {
        const cheapest = Math.min(
          ...s.candidateProducts.map((p) => p.productPrice)
        )
        return sum + cheapest * s.pickCount
      }
      return sum
    }, 0)
    const current = original * (1 - combo.discountPercent / 100)
    return { original, current, hasDiscount: combo.discountPercent > 0 }
  }

  // per_item mode — sum of all product prices
  const total = slots.reduce((sum, s) => {
    if (s.type === "fixed") {
      const price = s.customPrice ?? s.productPrice
      return sum + price * s.qty
    }
    if (s.type === "choice") {
      const cheapest = Math.min(
        ...s.candidateProducts.map((p) => p.productPrice)
      )
      return sum + cheapest * s.pickCount
    }
    return sum
  }, 0)

  return { original: total, current: total, hasDiscount: false }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComboCard({ combo, districtId }: ComboCardProps) {
  const [isPending, startTransition] = useTransition()
  const router = useLocationRouter()
  const { updateCart } = useCart()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const imageUrl = combo.imageUrl || "/placeholder-hero.png"
  const hasChoiceSlots = combo.slots.some((s) => s.type === "choice")
  const fixedSlots = combo.slots.filter(
    (s) => s.type === "fixed"
  ) as SerializedComboSlotFixed[]
  const choiceSlots = combo.slots.filter(
    (s) => s.type === "choice"
  ) as SerializedComboSlotChoice[]

  const { original, current, hasDiscount } = calculateComboPrice(
    combo,
    districtId
  )

  const handleDirectAdd = () => {
    startTransition(async () => {
      try {
        // Build selections for all fixed slots
        const selections = fixedSlots.map((slot, idx) => ({
          slotIndex: combo.slots.findIndex(
            (s) =>
              s.type === "fixed" &&
              (s as SerializedComboSlotFixed).productId === slot.productId
          ),
          productId: slot.productId,
          productName: slot.productName,
          qty: slot.qty,
          unitPrice: slot.customPrice ?? slot.productPrice,
        }))

        // Handle choice slots — auto-select cheapest option
        choiceSlots.forEach((slot) => {
          const cheapestIdx = combo.slots.findIndex(
            (s) =>
              s.type === "choice" &&
              (s as SerializedComboSlotChoice).pickCount === slot.pickCount
          )
          const cheapest = slot.candidateProducts.reduce(
            (min, p) => (p.productPrice < min.productPrice ? p : min),
            slot.candidateProducts[0]
          )

          for (let i = 0; i < slot.pickCount; i++) {
            selections.push({
              slotIndex: cheapestIdx,
              productId: cheapest.productId,
              productName: cheapest.productName,
              qty: 1,
              unitPrice: cheapest.productPrice,
            })
          }
        })

        const item = {
          type: "combo" as const,
          comboId: combo._id,
          comboName: combo.name,
          imageUrl: combo.imageUrl,
          finalPrice: current,
          qty: 1,
          selections,
        } as Parameters<typeof addComboToCartAction>[0]

        const res = await addComboToCartAction(item)
        if ((res as any)?.success) {
          toast.success(`Added ${combo.name} to cart`, {
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
                items: (res as any).cart.items,
              },
            })
          )
        } else {
          toast.error("Failed to add to cart")
        }
      } catch {
        toast.error("Failed to add to cart")
      }
    })
  }

  if (!combo.isActive) {
    return null
  }

  return (
    <>
      {/* MOBILE CARD */}
      <div className="block md:hidden">
        <Card className="group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border/50 bg-background p-0 shadow-xs transition-all duration-200 hover:shadow-md">
          <div className="relative h-28 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={combo.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>

          <CardContent className="flex flex-1 flex-col p-2 pt-1.5">
            <div className="flex flex-1 flex-col gap-0.5">
              <h3 className="line-clamp-2 min-h-[26px] text-[10px] leading-tight font-bold text-foreground">
                {combo.name}
              </h3>
              <span className="line-clamp-2 text-[9px] font-medium text-muted-foreground">
                {combo.description}
              </span>
            </div>

            <div className="mt-auto flex items-center justify-between gap-1 pt-2">
              <div className="flex flex-col leading-none">
                {hasDiscount && (
                  <span className="text-[8px] text-muted-foreground line-through">
                    ₹{original.toFixed(0)}
                  </span>
                )}
                <span className="text-xs font-black text-foreground">
                  ₹{current.toFixed(0)}
                </span>
              </div>

              {hasChoiceSlots ? (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 min-w-[48px] rounded-md px-2 text-[9px] font-black shadow-sm"
                  onClick={() => setIsPickerOpen(true)}
                  disabled={isPending}
                >
                  Customize
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 min-w-[48px] rounded-md px-2 text-[9px] font-black shadow-sm"
                  onClick={handleDirectAdd}
                  disabled={isPending}
                >
                  ADD
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DESKTOP CARD */}
      <div className="hidden md:block">
        <Card className="group relative flex flex-col gap-0 overflow-hidden rounded-2xl border-border/50 p-0 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="relative w-full overflow-hidden bg-muted/20 md:h-56 lg:h-64">
            <Image
              src={imageUrl}
              alt={combo.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1200px) 33vw, 25vw"
            />
          </div>

          <CardContent className="flex flex-1 flex-col p-5">
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-base font-semibold">
                  {combo.name}
                </h3>
                <span className="text-lg font-bold">₹{current.toFixed(0)}</span>
              </div>

              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{original.toFixed(0)}
                </span>
              )}

              <div className="mt-2 text-sm text-muted-foreground">
                {combo.description && (
                  <span className="line-clamp-2 block">
                    {combo.description}
                  </span>
                )}

                {/* Fixed items list */}
                {fixedSlots.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {fixedSlots.map((slot, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                        <span>
                          {slot.qty} × {slot.productName}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Choice slots */}
                {choiceSlots.map((slot, idx) => (
                  <p key={idx} className="mt-1 text-xs">
                    Choose any {slot.pickCount} from{" "}
                    {slot.candidateProducts
                      .slice(0, 3)
                      .map((p) => p.productName)
                      .join(", ")}
                    {slot.candidateProducts.length > 3 &&
                      ` +${slot.candidateProducts.length - 3} more`}
                  </p>
                ))}
              </div>

              <div className="mt-auto pt-5">
                {hasChoiceSlots ? (
                  <Button
                    variant="default"
                    className="h-11 w-full rounded-xl text-sm font-bold shadow-md"
                    onClick={() => setIsPickerOpen(true)}
                    disabled={isPending}
                  >
                    Customize & Add
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="h-11 w-full rounded-xl text-sm font-bold shadow-md"
                    onClick={handleDirectAdd}
                    disabled={isPending}
                  >
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combo Picker Modal */}
      <ComboPickerModal
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        combo={combo}
        districtId={districtId}
      />
    </>
  )
}

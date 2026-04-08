"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTransition } from "react"
import { toast } from "sonner"
import { useLocationRouter } from "@/hooks/use-location-router"
import { addComboToCartAction } from "@/server/actions/cart"
import { useCart } from "@/components/cart/cart-context"
import type { SerializedCombo, SerializedComboSlotChoice } from "./ComboCard"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, Check } from "lucide-react"

interface ComboPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  combo: SerializedCombo
  districtId: string
}

// Calculate combo price based on selections
function calculatePrice(
  combo: SerializedCombo,
  selections: Map<number, string[]> // slotIndex -> selected productIds
): number {
  let total = 0

  for (const slot of combo.slots) {
    if (slot.type === "fixed") {
      const price = slot.customPrice ?? slot.productPrice
      total += price * slot.qty
    } else if (slot.type === "choice") {
      const selectedIds = selections.get(combo.slots.indexOf(slot)) || []
      for (const productId of selectedIds) {
        const product = slot.candidateProducts.find(
          (p) => p.productId === productId
        )
        if (product) {
          total += product.productPrice
        }
      }
    }
  }

  // Apply discount based on pricing mode
  if (combo.pricingMode === "fixed" && combo.fixedPrice !== undefined) {
    const original = combo.slots.reduce((sum, s) => {
      if (s.type === "fixed") return sum + s.productPrice * s.qty
      if (s.type === "choice") {
        const cheapest = Math.min(
          ...s.candidateProducts.map((p) => p.productPrice)
        )
        return sum + cheapest * s.pickCount
      }
      return sum
    }, 0)
    // Return the lower of original (with selections) or fixed price
    return Math.min(total, combo.fixedPrice)
  }

  if (
    combo.pricingMode === "percent_discount" &&
    combo.discountPercent !== undefined
  ) {
    return total * (1 - combo.discountPercent / 100)
  }

  return total
}

export function ComboPickerModal({
  open,
  onOpenChange,
  combo,
  districtId,
}: ComboPickerModalProps) {
  const [isPending, startTransition] = useTransition()
  const router = useLocationRouter()
  const { updateCart } = useCart()

  // selections: Map<slotIndex, selectedProductIds[]>
  const [selections, setSelections] = useState<Map<number, string[]>>(new Map())

  const choiceSlots = useMemo(
    () =>
      combo.slots.filter(
        (s) => s.type === "choice"
      ) as SerializedComboSlotChoice[],
    [combo.slots]
  )

  // Validate all choice slots have correct pickCount
  const isValid = useMemo(() => {
    for (const slot of choiceSlots) {
      const slotIndex = combo.slots.indexOf(slot)
      const selected = selections.get(slotIndex) || []
      if (selected.length !== slot.pickCount) {
        return false
      }
    }
    return true
  }, [selections, choiceSlots, combo.slots])

  const currentPrice = useMemo(
    () => calculatePrice(combo, selections),
    [combo, selections]
  )

  const handleToggleProduct = (
    slotIndex: number,
    productId: string,
    pickCount: number
  ) => {
    console.error(
      "[Picker toggle] productId:",
      typeof productId,
      productId,
      JSON.stringify(productId)
    )
    setSelections((prev) => {
      const next = new Map(prev)
      const current = next.get(slotIndex) || []

      if (current.includes(productId)) {
        // Remove
        next.set(
          slotIndex,
          current.filter((id) => id !== productId)
        )
      } else {
        // Add (but respect pickCount limit)
        if (current.length < pickCount) {
          next.set(slotIndex, [...current, productId])
        }
      }

      return next
    })
  }

  const handleConfirm = () => {
    if (!isValid) return

    startTransition(async () => {
      try {
        // Build selections array
        const allSelections: Array<{
          slotIndex: number
          productId: string
          productName: string
          qty: number
          unitPrice: number
        }> = []

        console.error(
          "[Picker handleConfirm] selections Map entries:",
          Array.from(selections.entries()).map(([k, v]) => ({
            slotIndex: k,
            values: v.map((x) => ({
              type: typeof x,
              val: x,
              str: JSON.stringify(x),
            })),
          }))
        )

        // Fixed slots first
        combo.slots.forEach((slot, slotIndex) => {
          if (slot.type === "fixed") {
            allSelections.push({
              slotIndex,
              productId: slot.productId,
              productName: slot.productName,
              qty: slot.qty,
              unitPrice: slot.customPrice ?? slot.productPrice,
            })
          }
        })

        // Choice slots
        choiceSlots.forEach((slot) => {
          const slotIndex = combo.slots.indexOf(slot)
          const selectedIds = selections.get(slotIndex) || []

          selectedIds.forEach((productId) => {
            console.error(
              "[Picker confirm] productId:",
              typeof productId,
              productId,
              JSON.stringify(productId)
            )
            const product = slot.candidateProducts.find(
              (p) => p.productId === productId
            )
            if (product) {
              console.error(
                "[Picker confirm] found product:",
                product.productId,
                typeof product.productId
              )
              allSelections.push({
                slotIndex,
                productId: product.productId,
                productName: product.productName,
                qty: 1,
                unitPrice: product.productPrice,
              })
            }
          })
        })

        const item = {
          type: "combo" as const,
          comboId: combo._id,
          comboName: combo.name,
          imageUrl: combo.imageUrl,
          finalPrice: currentPrice,
          qty: 1,
          selections: allSelections,
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
          onOpenChange(false)
          // Reset selections
          setSelections(new Map())
        } else {
          toast.error("Failed to add to cart")
        }
      } catch {
        toast.error("Failed to add to cart")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{combo.name}</SheetTitle>
          <SheetDescription>
            Select your choices for each option below.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 py-4">
          <div className="space-y-6">
            {choiceSlots.map((slot, idx) => {
              const slotIndex = combo.slots.indexOf(slot)
              const selected = selections.get(slotIndex) || []
              const remaining = slot.pickCount - selected.length

              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        {slot.label ||
                          `Choose ${slot.pickCount} item${slot.pickCount > 1 ? "s" : ""}`}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Select exactly {slot.pickCount}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${remaining === 0 ? "text-green-600" : "text-orange-600"}`}
                    >
                      {selected.length}/{slot.pickCount} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {slot.candidateProducts.map((product) => {
                      const isSelected = selected.includes(product.productId)
                      const isDisabled = !isSelected && remaining === 0

                      return (
                        <button
                          key={product.productId}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            console.error(
                              "[Picker onClick] product.productId:",
                              typeof product.productId,
                              product.productId,
                              JSON.stringify(product.productId)
                            )
                            handleToggleProduct(
                              slotIndex,
                              product.productId,
                              slot.pickCount
                            )
                          }}
                          className={`relative flex flex-col items-center gap-1 rounded-lg border p-2 text-left transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                              : isDisabled
                                ? "cursor-not-allowed border-muted opacity-50"
                                : "border-border hover:border-green-400 hover:bg-muted/50"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          {product.productImageUrl && (
                            <div className="relative h-12 w-full overflow-hidden rounded">
                              <Image
                                src={product.productImageUrl}
                                alt={product.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="line-clamp-1 w-full text-center text-xs font-medium">
                            {product.productName}
                          </span>
                          <span className="text-xs font-semibold text-green-600">
                            ₹{product.productPrice.toFixed(0)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Footer with price and confirm */}
        <div className="mt-4 border-t pt-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium">Total Price</span>
            <span className="text-xl font-bold">
              ₹{currentPrice.toFixed(0)}
            </span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isValid
              ? "Add to Cart"
              : `Select ${choiceSlots.reduce((sum, s) => sum + s.pickCount, 0) - selections.size} more item(s)`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

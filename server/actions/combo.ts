"use server"

import { revalidatePath } from "next/cache"
import { createCombo, updateCombo, deleteCombo, toggleComboActive } from "@/lib/data/combos"

/**
 * Creates a new combo.
 * Validates the input and revalidates the admin combos listing page on success.
 */
export async function createComboAction(data: {
  name: string
  description?: string
  imageUrl?: string
  isActive?: boolean
  pricingMode: "fixed" | "percent_discount" | "per_item"
  fixedPrice?: number
  discountPercent?: number
  displayOrder?: number
  availableInAllDistricts?: boolean
  unavailableDistricts?: string[]
  slots: Array<{
    type: "fixed"
    productId: string
    qty: number
    customPrice?: number
  } | {
    type: "choice"
    pickCount: number
    candidateProductIds: string[]
    label?: string
  }>
}) {
  try {
    if (!data.name?.trim()) return { error: "Combo name is required" }
    if (!data.pricingMode) return { error: "Pricing mode is required" }
    if (!data.slots || data.slots.length === 0) {
      return { error: "Combo must have at least one slot" }
    }

    const newCombo = await createCombo(data as any)

    revalidatePath("/fmg-admin/combos")
    return { success: true, combo: JSON.parse(JSON.stringify(newCombo)) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Create Combo Action Error:", err)
    return { error: "Failed to create combo" }
  }
}

/**
 * Partially updates an existing combo.
 * Revalidates the admin combos listing page on success.
 */
export async function updateComboAction(
  id: string,
  data: {
    name?: string
    description?: string
    imageUrl?: string
    isActive?: boolean
    pricingMode?: "fixed" | "percent_discount" | "per_item"
    fixedPrice?: number
    discountPercent?: number
    displayOrder?: number
    availableInAllDistricts?: boolean
    unavailableDistricts?: string[]
    slots?: Array<{
      type: "fixed"
      productId: string
      qty: number
      customPrice?: number
    } | {
      type: "choice"
      pickCount: number
      candidateProductIds: string[]
      label?: string
    }>
  }
) {
  try {
    const updated = await updateCombo(id, data as any)

    if (!updated) {
      return { error: "Combo not found" }
    }

    revalidatePath("/fmg-admin/combos")
    return { success: true }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Update Combo Action Error:", err)
    return { error: "Failed to update combo" }
  }
}

/**
 * Permanently deletes a combo.
 * Revalidates the admin combos listing page on success.
 */
export async function deleteComboAction(id: string) {
  try {
    const deleted = await deleteCombo(id)

    if (!deleted) {
      return { error: "Combo not found" }
    }

    revalidatePath("/fmg-admin/combos")
    return { success: true }
  } catch (error) {
    console.error("Delete Combo Action Error:", error)
    return { error: "Failed to delete combo" }
  }
}

/**
 * Flips the isActive flag of a combo.
 * Revalidates the admin combos listing page on success.
 */
export async function toggleComboActiveAction(id: string) {
  try {
    const updated = await toggleComboActive(id)

    if (!updated) {
      return { error: "Combo not found" }
    }

    revalidatePath("/fmg-admin/combos")
    return { success: true }
  } catch (error) {
    console.error("Toggle Combo Active Action Error:", error)
    return { error: "Failed to toggle combo active status" }
  }
}

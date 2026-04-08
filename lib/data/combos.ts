import { connectDB } from "../db"
import ComboModel, { ICombo, IComboPlain } from "../models/Combo"
import DistrictModel from "../models/district"
import ProductModel from "../models/product"

/**
 * Returns all active combos visible to customers, sorted by displayOrder.
 * Slots are fully populated so callers have product details on demand.
 */
export async function getCombos(): Promise<IComboPlain[]> {
  await connectDB()
  const combos = await ComboModel.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean()
  return combos as IComboPlain[]
}

/**
 * Returns a single combo by its _id, with all slot product refs populated.
 * Returns null if not found.
 */
export async function getComboById(id: string): Promise<IComboPlain | null> {
  await connectDB()
  const combo = await ComboModel.findById(id).lean()
  return (combo as IComboPlain) ?? null
}

/**
 * Returns active combos filtered to the given district slug.
 * Combos whose unavailableDistricts contains the matching district are excluded.
 * Slots are populated with product details (name, price, imageUrl) for display.
 */
export async function getCombosByDistrict(
  districtSlug: string
): Promise<IComboPlain[]> {
  await connectDB()
  const district = await DistrictModel.findOne({
    name: { $regex: new RegExp(`^${districtSlug}$`, "i") },
  }).lean()
  if (!district) return []

  const districtId = district._id.toString()

  // Fetch active combos sorted by display order
  const combos = await ComboModel.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean()

  if (!combos || combos.length === 0) return []

  // Collect all product IDs needed for population
  const productIdsToFetch = new Set<string>()

  for (const combo of combos as IComboPlain[]) {
    for (const slot of combo.slots as any[]) {
      if (slot.type === "fixed" && slot.productId) {
        productIdsToFetch.add(slot.productId.toString())
      } else if (slot.type === "choice" && slot.candidateProductIds) {
        for (const pid of slot.candidateProductIds) {
          productIdsToFetch.add(pid.toString())
        }
      }
    }
  }

  // Fetch all needed products in one query
  const products = await ProductModel.find({
    _id: { $in: Array.from(productIdsToFetch) },
  })
    .select("name price imageUrl")
    .lean()

  // Create a map for quick lookup
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  // Populate slots with product data
  const populatedCombos = (combos as IComboPlain[]).map((combo) => {
    const processedSlots = (combo.slots as any[]).map((slot) => {
      if (slot.type === "fixed" && slot.productId) {
        const pid = slot.productId.toString()
        const product = productMap.get(pid)
        return {
          ...slot,
          productId: {
            _id: pid,
            name: product?.name ?? "Unknown",
            price: product?.price ?? 0,
            imageUrl: product?.imageUrl,
          },
        }
      } else if (slot.type === "choice" && slot.candidateProductIds) {
        const populatedCandidates = (slot.candidateProductIds as any[]).map(
          (pid) => {
            const product = productMap.get(pid.toString())
            return {
              _id: pid,
              name: product?.name ?? "Unknown",
              price: product?.price ?? 0,
              imageUrl: product?.imageUrl,
            }
          }
        )
        return {
          ...slot,
          candidateProductIds: populatedCandidates,
        }
      }
      return slot
    })
    return { ...combo, slots: processedSlots }
  })

  // Filter by district availability
  return (populatedCombos as IComboPlain[]).filter((combo) => {
    if (combo.availableInAllDistricts) return true
    return !combo.unavailableDistricts.some(
      (id) => id.toString() === districtId
    )
  })
}

/**
 * Returns ALL combos regardless of isActive — for admin listing pages.
 * Slots are not populated here; admin components can populate selectively.
 */
export async function getAllCombosAdmin(): Promise<IComboPlain[]> {
  await connectDB()
  const combos = await ComboModel.find().sort({ displayOrder: 1 }).lean()
  return combos as IComboPlain[]
}

/**
 * Inserts a new combo. Accepts a partial ICombo payload.
 * The caller is responsible for validating required fields before calling.
 */
export async function createCombo(data: Partial<ICombo>): Promise<ICombo> {
  await connectDB()
  const doc = await ComboModel.create(data)
  return doc.toObject() as ICombo
}

/**
 * Partial update of an existing combo. Returns the updated document
 * or null if the combo was not found.
 */
export async function updateCombo(
  id: string,
  data: Partial<ICombo>
): Promise<IComboPlain | null> {
  await connectDB()
  const updated = await ComboModel.findByIdAndUpdate(id, data, {
    new: true,
  }).lean()
  return (updated as IComboPlain) ?? null
}

/**
 * Permanently deletes a combo. Returns the deleted document
 * or null if it did not exist.
 */
export async function deleteCombo(id: string): Promise<IComboPlain | null> {
  await connectDB()
  const deleted = await ComboModel.findByIdAndDelete(id).lean()
  return (deleted as IComboPlain) ?? null
}

/**
 * Flips the isActive flag of a combo. Returns the updated document
 * or null if the combo was not found.
 */
export async function toggleComboActive(
  id: string
): Promise<IComboPlain | null> {
  await connectDB()
  const combo = await ComboModel.findById(id).lean()
  if (!combo) return null
  const updated = await ComboModel.findByIdAndUpdate(
    id,
    { isActive: !(combo as IComboPlain).isActive },
    { new: true }
  ).lean()
  return (updated as IComboPlain) ?? null
}

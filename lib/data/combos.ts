import { connectDB } from "../db"
import ComboModel, { ICombo, ComboSlot } from "../models/Combo"
import DistrictModel from "../models/district"

/**
 * Returns all active combos visible to customers, sorted by displayOrder.
 * Slots are fully populated so callers have product details on demand.
 */
export async function getCombos(): Promise<ICombo[]> {
  await connectDB()
  const combos = await ComboModel.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean()
  return combos as ICombo[]
}

/**
 * Returns a single combo by its _id, with all slot product refs populated.
 * Returns null if not found.
 */
export async function getComboById(id: string): Promise<ICombo | null> {
  await connectDB()
  const combo = await ComboModel.findById(id).lean()
  return (combo as ICombo) ?? null
}

/**
 * Returns active combos filtered to the given district slug.
 * Combos whose unavailableDistricts contains the matching district are excluded.
 * Slots are NOT auto-populated here — callers that need product details
 * should call getComboById for the specific combos they render.
 */
export async function getCombosByDistrict(
  districtSlug: string
): Promise<ICombo[]> {
  await connectDB()
  const district = await DistrictModel.findOne({
    name: { $regex: new RegExp(`^${districtSlug}$`, "i") },
  }).lean()
  if (!district) return []

  const districtId = district._id.toString()
  const combos = await ComboModel.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .lean()

  return (combos as ICombo[]).filter((combo) => {
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
export async function getAllCombosAdmin(): Promise<ICombo[]> {
  await connectDB()
  const combos = await ComboModel.find()
    .sort({ displayOrder: 1 })
    .lean()
  return combos as ICombo[]
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
): Promise<ICombo | null> {
  await connectDB()
  const updated = await ComboModel.findByIdAndUpdate(id, data, {
    new: true,
  })
    .lean()
  return (updated as ICombo) ?? null
}

/**
 * Permanently deletes a combo. Returns the deleted document
 * or null if it did not exist.
 */
export async function deleteCombo(id: string): Promise<ICombo | null> {
  await connectDB()
  const deleted = await ComboModel.findByIdAndDelete(id).lean()
  return (deleted as ICombo) ?? null
}

/**
 * Flips the isActive flag of a combo. Returns the updated document
 * or null if the combo was not found.
 */
export async function toggleComboActive(id: string): Promise<ICombo | null> {
  await connectDB()
  const combo = await ComboModel.findById(id).lean()
  if (!combo) return null
  const updated = await ComboModel.findByIdAndUpdate(
    id,
    { isActive: !(combo as ICombo).isActive },
    { new: true }
  )
    .lean()
  return (updated as ICombo) ?? null
}

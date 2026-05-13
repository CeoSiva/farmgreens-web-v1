"use server"

import { revalidatePath } from "next/cache"
import {
  DistrictSchema,
  AreaSchema,
  ApartmentSchema,
} from "@/lib/schemas/location-admin"
import {
  createDistrict,
  updateDistrict,
  deleteDistrict,
  createArea,
  renameArea,
  updateArea,
  deleteArea,
  bulkCreateAreas,
  bulkUpdateAreas,
  createApartment,
  renameApartment,
  updateApartment,
  deleteApartment,
  bulkCreateApartments,
  bulkUpdateApartmentDeliveryDays,
  findAreaByPincode,
  listEnabledAreasByDistrict,
} from "@/lib/data/location-admin"

export async function createDistrictAction(payload: { name: string }) {
  const parsed = DistrictSchema.safeParse(payload)
  if (!parsed.success) return { error: "Invalid district" }
  try {
    const district = await createDistrict(parsed.data.name)
    revalidatePath("/fmg-admin/settings")
    return { success: true, district: JSON.parse(JSON.stringify(district)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create district" }
  }
}

export async function updateDistrictAction(payload: {
  id: string
  name?: string
  isCodEnabled?: boolean
  isEnabled?: boolean
  deliveryCenter?: { lat: number; lng: number }
  deliveryRadius?: number
}) {
  const parsed = DistrictSchema.partial().safeParse(payload)
  if (!parsed.success) return { error: "Invalid district data" }
  try {
    const district = await updateDistrict(payload.id, parsed.data)
    revalidatePath("/fmg-admin/settings")
    return { success: true, district: JSON.parse(JSON.stringify(district)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to update district" }
  }
}

export async function toggleDistrictCodAction(id: string, enabled: boolean) {
  try {
    await updateDistrict(id, { isCodEnabled: enabled })
    revalidatePath("/fmg-admin/settings", "page")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to toggle COD" }
  }
}

export async function toggleDistrictEnabledAction(
  id: string,
  enabled: boolean
) {
  try {
    await updateDistrict(id, { isEnabled: enabled })
    revalidatePath("/fmg-admin/settings", "page")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to toggle district visibility" }
  }
}

export async function toggleDistrictApartmentsAction(id: string, enabled: boolean) {
  try {
    await updateDistrict(id, { hasApartments: enabled })
    revalidatePath("/fmg-admin/settings", "page")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to toggle apartment selection" }
  }
}

export async function deleteDistrictAction(payload: { id: string }) {
  try {
    await deleteDistrict(payload.id)
    revalidatePath("/fmg-admin/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to delete district" }
  }
}

export async function createAreaAction(payload: {
  districtId: string
  name: string
  pincode?: string
  isEnabled?: boolean
}) {
  const parsed = AreaSchema.safeParse(payload)
  if (!parsed.success) return { error: "Invalid area" }
  try {
    const area = await createArea(
      parsed.data.districtId,
      parsed.data.name,
      parsed.data.pincode,
      parsed.data.isEnabled ?? true
    )
    revalidatePath("/fmg-admin/settings")
    return { success: true, area: JSON.parse(JSON.stringify(area)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create area" }
  }
}

export async function renameAreaAction(payload: { id: string; name: string }) {
  const parsed = DistrictSchema.safeParse({ name: payload.name })
  if (!parsed.success) return { error: "Invalid area" }
  try {
    const area = await renameArea(payload.id, parsed.data.name)
    revalidatePath("/fmg-admin/settings")
    return { success: true, area: JSON.parse(JSON.stringify(area)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to rename area" }
  }
}

export async function updateAreaAction(payload: {
  id: string
  name?: string
  pincode?: string
  isEnabled?: boolean
}) {
  const parsed = AreaSchema.partial().safeParse(payload)
  if (!parsed.success) return { error: "Invalid area data" }
  try {
    const area = await updateArea(payload.id, parsed.data)
    revalidatePath("/fmg-admin/settings")
    return { success: true, area: JSON.parse(JSON.stringify(area)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to update area" }
  }
}

export async function toggleAreaEnabledAction(id: string, enabled: boolean) {
  try {
    await updateArea(id, { isEnabled: enabled })
    revalidatePath("/fmg-admin/settings", "page")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to toggle area visibility" }
  }
}

export async function bulkUpdateAreasAction(
  areas: { id: string; name: string; pincode?: string; isEnabled: boolean }[]
) {
  try {
    await bulkUpdateAreas(areas)
    revalidatePath("/fmg-admin/settings")
    return { success: true, count: areas.length }
} catch (e: any) {
    return { error: e?.message ?? "Failed to update areas" }
  }
}

export async function deleteAreaAction(payload: { id: string }) {
  try {
    await deleteArea(payload.id)
    revalidatePath("/fmg-admin/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to delete area" }
  }
}

export async function bulkCreateAreasAction(payload: {
  districtId: string
  areas: { name: string; pincode?: string }[]
}) {
  if (!payload.districtId) return { error: "District is required" }
  const areas = payload.areas.filter((a) => a.name.trim())
  if (areas.length === 0) return { error: "No valid area names provided" }
  try {
    const created = await bulkCreateAreas(payload.districtId, areas)
    revalidatePath("/fmg-admin/settings")
    return { success: true, count: created.length }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create areas" }
  }
}

export async function createApartmentAction(payload: {
  districtId: string
  name: string
  deliveryDays?: number[]
  isCodEnabled?: boolean
}) {
  const parsed = ApartmentSchema.safeParse(payload)
  if (!parsed.success) return { error: "Invalid apartment" }
  try {
    const apartment = await createApartment(
      parsed.data.districtId,
      parsed.data.name,
      parsed.data.deliveryDays,
      parsed.data.isCodEnabled,
      parsed.data.isEnabled ?? true
    )
    revalidatePath("/fmg-admin/settings")
    return { success: true, apartment: JSON.parse(JSON.stringify(apartment)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create apartment" }
  }
}

export async function renameApartmentAction(payload: {
  id: string
  name: string
}) {
  // Can reuse a generic schema or recreate if needed. ApartmentSchema requires districtId which we don't need for rename, so we just use DistrictSchema structural equality for "name".
  const parsed = DistrictSchema.safeParse({ name: payload.name })
  if (!parsed.success) return { error: "Invalid apartment name" }
  try {
    const apartment = await renameApartment(payload.id, parsed.data.name)
    revalidatePath("/fmg-admin/settings")
    return { success: true, apartment: JSON.parse(JSON.stringify(apartment)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to rename apartment" }
  }
}

export async function updateApartmentAction(payload: {
  id: string
  name?: string
  deliveryDays?: number[]
  isCodEnabled?: boolean
  isEnabled?: boolean
}) {
  const parsed = ApartmentSchema.partial().safeParse(payload)
  if (!parsed.success) return { error: "Invalid apartment data" }

  try {
    const apartment = await updateApartment(payload.id, parsed.data)
    revalidatePath("/fmg-admin/settings")
    return { success: true, apartment: JSON.parse(JSON.stringify(apartment)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to update apartment" }
  }
}

export async function toggleApartmentCodAction(id: string, enabled: boolean) {
  try {
    await updateApartment(id, { isCodEnabled: enabled })
    revalidatePath("/fmg-admin/settings", "page")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to toggle COD" }
  }
}

export async function toggleApartmentEnabledAction(id: string, enabled: boolean) {
  try {
    await updateApartment(id, { isEnabled: enabled })
    revalidatePath("/fmg-admin/settings", "page")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to toggle apartment visibility" }
  }
}

export async function deleteApartmentAction(payload: { id: string }) {
  try {
    await deleteApartment(payload.id)
    revalidatePath("/fmg-admin/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to delete apartment" }
  }
}

export async function bulkCreateApartmentsAction(payload: {
  districtId: string
  names: string[]
}) {
  if (!payload.districtId) return { error: "District is required" }
  const names = payload.names.map((n) => n.trim()).filter(Boolean)
  if (names.length === 0) return { error: "No valid apartment names provided" }
  try {
    const apartments = await bulkCreateApartments(payload.districtId, names)
    revalidatePath("/fmg-admin/settings")
    return { success: true, count: apartments.length }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create apartments" }
  }
}

export async function bulkAssignDeliveryDaysAction(payload: {
  apartmentIds: string[]
  deliveryDays: number[]
}) {
  if (!payload.apartmentIds || payload.apartmentIds.length === 0)
    return { error: "No apartments selected" }
  if (payload.deliveryDays.some((d) => d < 0 || d > 6))
    return { error: "Invalid delivery day" }
  try {
    await bulkUpdateApartmentDeliveryDays(
      payload.apartmentIds,
      payload.deliveryDays
    )
    revalidatePath("/fmg-admin/settings")
    return { success: true }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to assign delivery days" }
  }
}

export async function findAreaByPincodeAction(
  pincode: string,
  districtId: string
) {
  try {
    const area = await findAreaByPincode(pincode, districtId)
    return { success: true, area }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to find area" }
  }
}

export async function listEnabledAreasByDistrictAction(districtId: string) {
  try {
    const areas = await listEnabledAreasByDistrict(districtId)
    return { success: true, areas: JSON.parse(JSON.stringify(areas)) }
  } catch (e: any) {
    return { error: e?.message ?? "Failed to list areas" }
  }
}

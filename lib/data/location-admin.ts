import { connectDB } from "../db"
import DistrictModel from "../models/district"
import AreaModel from "../models/area"
import ApartmentModel from "../models/apartment"
import CustomerModel from "../models/customer"
import OrderModel from "../models/order"

export async function createDistrict(name: string) {
  await connectDB()
  return DistrictModel.create({ name })
}

export async function updateDistrict(
  id: string,
  data: {
    name?: string
    isCodEnabled?: boolean
    isEnabled?: boolean
    hasApartments?: boolean
    deliveryCenter?: { lat: number; lng: number }
    deliveryRadius?: number
  }
) {
  await connectDB()
  const updated = await DistrictModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()
  if (!updated) throw new Error("District not found")
  return updated
}

export async function deleteDistrict(id: string) {
  await connectDB()
  const usedByCustomers = await CustomerModel.exists({
    "addresses.districtId": id,
  })
  const usedByOrders = await OrderModel.exists({
    "shippingAddress.districtId": id,
  })
  if (usedByCustomers || usedByOrders) {
    throw new Error("Cannot delete district: in use by customers or orders")
  }

  const areas = await AreaModel.find({ districtId: id }).lean()
  if (areas.length > 0) {
    throw new Error("Cannot delete district: it still has areas")
  }

  const apartments = await ApartmentModel.find({ districtId: id }).lean()
  if (apartments.length > 0) {
    throw new Error("Cannot delete district: it still has apartments")
  }

  const deleted = await DistrictModel.findByIdAndDelete(id).lean()
  if (!deleted) throw new Error("District not found")
  return deleted
}

export async function createArea(
  districtId: string,
  name: string,
  pincode?: string,
  isEnabled: boolean = true
) {
  await connectDB()
  return AreaModel.create({ districtId, name, pincode, isEnabled })
}

export async function renameArea(id: string, name: string) {
  await connectDB()
  const updated = await AreaModel.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  ).lean()
  if (!updated) throw new Error("Area not found")
  return updated
}

export async function updateArea(
  id: string,
  data: { name?: string; pincode?: string; isEnabled?: boolean }
) {
  await connectDB()
  const updated = await AreaModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()
  if (!updated) throw new Error("Area not found")
  return updated
}

export async function bulkUpdateAreas(
  areas: { id: string; name: string; pincode?: string; isEnabled: boolean }[]
) {
  console.log("Data layer received:", JSON.stringify(areas, null, 2))
  await connectDB()
  const promises = areas.map((area) => {
    console.log(`Updating area ${area.id}:`, { name: area.name, pincode: area.pincode, isEnabled: area.isEnabled })
    return AreaModel.findByIdAndUpdate(
      area.id,
      { $set: { name: area.name, pincode: area.pincode || null, isEnabled: area.isEnabled } },
      { new: true }
    )
  })
  return Promise.all(promises)
}

export async function deleteArea(id: string) {
  await connectDB()
  const usedByCustomers = await CustomerModel.exists({ "addresses.areaId": id })
  const usedByOrders = await OrderModel.exists({ "shippingAddress.areaId": id })
  if (usedByCustomers || usedByOrders) {
    throw new Error("Cannot delete area: in use by customers or orders")
  }
  const deleted = await AreaModel.findByIdAndDelete(id).lean()
  if (!deleted) throw new Error("Area not found")
  return deleted
}

export async function listAreasForDistrict(districtId: string) {
  await connectDB()
  return AreaModel.find({ districtId }).sort({ name: 1 }).lean()
}

export async function listEnabledAreasByDistrict(districtId: string) {
  await connectDB()
  return AreaModel.find({ districtId, isEnabled: true })
    .sort({ name: 1 })
    .lean()
}

export async function findAreaByPincode(
  pincode: string,
  districtId: string
) {
  await connectDB()

  const normalizedPincode = pincode?.trim()

  let area = await AreaModel.findOne({
    pincode: normalizedPincode,
    districtId,
    isEnabled: true,
  }).lean()

  if (!area) {
    area = await AreaModel.findOne({
      pincode: { $regex: normalizedPincode, $options: "i" },
      districtId,
      isEnabled: true,
    }).lean()
  }

  return area
}

export async function bulkCreateAreas(
  districtId: string,
  areas: { name: string; pincode?: string }[],
  isEnabled: boolean = true
) {
  await connectDB()
  const docs = areas.map((area) => ({
    districtId,
    name: area.name,
    pincode: area.pincode || undefined,
    isEnabled,
  }))
  return AreaModel.insertMany(docs)
}

export async function createApartment(
  districtId: string,
  name: string,
  deliveryDays: number[] = [],
  isCodEnabled: boolean = true,
  isEnabled: boolean = true
) {
  await connectDB()
  return ApartmentModel.create({ districtId, name, deliveryDays, isCodEnabled, isEnabled })
}

export async function renameApartment(id: string, name: string) {
  await connectDB()
  const updated = await ApartmentModel.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  ).lean()
  if (!updated) throw new Error("Apartment not found")
  return updated
}

export async function updateApartment(
  id: string,
  data: { name?: string; deliveryDays?: number[]; isCodEnabled?: boolean; isEnabled?: boolean }
) {
  await connectDB()

  const updated = await ApartmentModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()

  if (!updated) throw new Error("Apartment not found")
  return updated
}

export async function bulkUpdateApartmentDeliveryDays(
  ids: string[],
  deliveryDays: number[]
) {
  await connectDB()
  await ApartmentModel.updateMany(
    { _id: { $in: ids } },
    { $set: { deliveryDays } }
  )
}

export async function deleteApartment(id: string) {
  await connectDB()
  // Generic safe delete (extend with orders/customers checks if needed later)
  const deleted = await ApartmentModel.findByIdAndDelete(id).lean()
  if (!deleted) throw new Error("Apartment not found")
  return deleted
}

export async function listApartmentsForDistrict(districtId: string) {
  await connectDB()
  return ApartmentModel.find({ districtId }).sort({ name: 1 }).lean()
}

export async function bulkCreateApartments(
  districtId: string,
  names: string[]
) {
  await connectDB()
  const docs = names.map((name) => ({ districtId, name }))
  return ApartmentModel.insertMany(docs)
}

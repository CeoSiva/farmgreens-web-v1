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

export async function updateDistrict(id: string, data: { name?: string; isCodEnabled?: boolean }) {
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

export async function createArea(districtId: string, name: string) {
  await connectDB()
  return AreaModel.create({ districtId, name })
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

export async function bulkCreateAreas(districtId: string, names: string[]) {
  await connectDB()
  const docs = names.map((name) => ({ districtId, name }))
  return AreaModel.insertMany(docs)
}

export async function createApartment(
  districtId: string,
  name: string,
  deliveryDays: number[] = [],
  isCodEnabled: boolean = true
) {
  await connectDB()
  return ApartmentModel.create({ districtId, name, deliveryDays, isCodEnabled })
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
  data: { name?: string; deliveryDays?: number[]; isCodEnabled?: boolean }
) {
  await connectDB()
  const logMsg = `Updating apartment ${id} with data: ${JSON.stringify(data)}\n`;
  require('fs').appendFileSync('/home/ceo/projects/Ziver/FarmGreens/farmgreens-web-v1/scratch/db_log.txt', logMsg);
  
  const updated = await ApartmentModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean()
  
  const resultMsg = `Updated apartment ${id} result isCodEnabled: ${updated?.isCodEnabled}\n`;
  require('fs').appendFileSync('/home/ceo/projects/Ziver/FarmGreens/farmgreens-web-v1/scratch/db_log.txt', resultMsg);
  
  if (!updated) throw new Error("Apartment not found")
  return updated
}

export async function bulkUpdateApartmentDeliveryDays(ids: string[], deliveryDays: number[]) {
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

export async function bulkCreateApartments(districtId: string, names: string[]) {
  await connectDB()
  const docs = names.map((name) => ({ districtId, name }))
  return ApartmentModel.insertMany(docs)
}

import { connectDB } from "../db";
import DistrictModel from "../models/district";
import AreaModel from "../models/area";
import CustomerModel from "../models/customer";
import OrderModel from "../models/order";

export async function createDistrict(name: string) {
  await connectDB();
  return DistrictModel.create({ name });
}

export async function renameDistrict(id: string, name: string) {
  await connectDB();
  const updated = await DistrictModel.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  ).lean();
  if (!updated) throw new Error("District not found");
  return updated;
}

export async function deleteDistrict(id: string) {
  await connectDB();
  const usedByCustomers = await CustomerModel.exists({
    "addresses.districtId": id,
  });
  const usedByOrders = await OrderModel.exists({
    "shippingAddress.districtId": id,
  });
  if (usedByCustomers || usedByOrders) {
    throw new Error("Cannot delete district: in use by customers or orders");
  }

  const areas = await AreaModel.find({ districtId: id }).lean();
  if (areas.length > 0) {
    throw new Error("Cannot delete district: it still has areas");
  }

  const deleted = await DistrictModel.findByIdAndDelete(id).lean();
  if (!deleted) throw new Error("District not found");
  return deleted;
}

export async function createArea(districtId: string, name: string) {
  await connectDB();
  return AreaModel.create({ districtId, name });
}

export async function renameArea(id: string, name: string) {
  await connectDB();
  const updated = await AreaModel.findByIdAndUpdate(id, { name }, { new: true }).lean();
  if (!updated) throw new Error("Area not found");
  return updated;
}

export async function deleteArea(id: string) {
  await connectDB();
  const usedByCustomers = await CustomerModel.exists({ "addresses.areaId": id });
  const usedByOrders = await OrderModel.exists({ "shippingAddress.areaId": id });
  if (usedByCustomers || usedByOrders) {
    throw new Error("Cannot delete area: in use by customers or orders");
  }
  const deleted = await AreaModel.findByIdAndDelete(id).lean();
  if (!deleted) throw new Error("Area not found");
  return deleted;
}

export async function listAreasForDistrict(districtId: string) {
  await connectDB();
  return AreaModel.find({ districtId }).sort({ name: 1 }).lean();
}

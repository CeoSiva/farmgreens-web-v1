import { connectDB } from "../db";
import DistrictModel, { IDistrict } from "../models/district";
import AreaModel, { IArea } from "../models/area";

export async function listDistricts(): Promise<IDistrict[]> {
  await connectDB();
  return DistrictModel.find().sort({ name: 1 }).lean();
}

export async function listAreasByDistrict(districtId: string): Promise<IArea[]> {
  await connectDB();
  return AreaModel.find({ districtId }).sort({ name: 1 }).lean();
}

export async function getDistrictById(districtId: string): Promise<IDistrict | null> {
  await connectDB();
  return DistrictModel.findById(districtId).lean();
}

export async function getAreaById(areaId: string): Promise<IArea | null> {
  await connectDB();
  return AreaModel.findById(areaId).lean();
}

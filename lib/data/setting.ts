import { connectDB } from "../db";
import SettingModel, { ISetting } from "../models/setting";
import { unstable_noStore as noStore } from "next/cache";

export async function getSettings(): Promise<ISetting> {
  noStore();
  await connectDB();
  const existing = await SettingModel.findOne().lean();
  if (existing) return existing as any;

  const created = await SettingModel.create({});
  return created.toObject() as any;
}

export async function updateSettings(patch: Partial<ISetting>): Promise<ISetting> {
  await connectDB();
  const existing = await SettingModel.findOne();
  if (!existing) {
    const created = await SettingModel.create(patch);
    return created.toObject() as any;
  }

  existing.set(patch);
  await existing.save();
  return existing.toObject() as any;
}

import { connectDB } from "../db";
import SettingModel, { ISetting } from "../models/setting";

export async function getSettings(): Promise<ISetting> {
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

  Object.assign(existing, patch);
  await existing.save();
  return existing.toObject() as any;
}

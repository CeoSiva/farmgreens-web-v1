import { connectDB } from "../db";
import SystemSettingModel, { ISystemSetting } from "../models/system-setting";

/**
 * Fetches a system setting by its key.
 * If the key doesn't exist and it's the delivery banner message, seeds it with a default value.
 */
export async function getSystemSetting(key: string): Promise<string> {
  await connectDB();
  const setting = await SystemSettingModel.findOne({ key }).lean();

  if (!setting) {
    if (key === "delivery_banner_message") {
      const defaultValue = "Your current orders will be delivered on Monday (20/04/2026)";
      await SystemSettingModel.create({ key, value: defaultValue });
      return defaultValue;
    }
    return "";
  }

  return (setting as any).value;
}

/**
 * Updates or creates a system setting.
 */
export async function updateSystemSetting(key: string, value: string): Promise<ISystemSetting> {
  await connectDB();
  const setting = await SystemSettingModel.findOneAndUpdate(
    { key },
    { value },
    { new: true, upsert: true }
  );
  return setting.toObject() as any;
}

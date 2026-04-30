"use server";

import { revalidatePath } from "next/cache";
import { DeliveryFeeSchema, StoreProfileSchema } from "@/lib/schemas/settings";
import { getSettings, updateSettings } from "@/lib/data/setting";

export async function getSettingsAction() {
  const settings = await getSettings();
  return { settings: JSON.parse(JSON.stringify(settings)) };
}

export async function updateStoreProfileAction(payload: {
  storeName: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  storeAddress?: string;
}) {
  const parsed = StoreProfileSchema.safeParse(payload);
  if (!parsed.success) return { error: "Invalid store profile data" };

  await updateSettings(parsed.data as any);
  revalidatePath("/fmg-admin/settings");
  return { success: true };
}

export async function updateDeliveryFeeAction(payload: { 
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isCodEnabled: boolean;
}) {
  const parsed = DeliveryFeeSchema.safeParse(payload);
  if (!parsed.success) return { error: "Invalid delivery settings" };

  await updateSettings({ 
    deliveryFee: parsed.data.deliveryFee,
    freeDeliveryThreshold: parsed.data.freeDeliveryThreshold,
    isCodEnabled: parsed.data.isCodEnabled,
  } as any);
  revalidatePath("/fmg-admin/settings");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { success: true };
}

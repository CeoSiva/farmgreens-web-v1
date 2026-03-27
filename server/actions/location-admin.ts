"use server";

import { revalidatePath } from "next/cache";
import { DistrictSchema, AreaSchema } from "@/lib/schemas/location-admin";
import {
  createDistrict,
  renameDistrict,
  deleteDistrict,
  createArea,
  renameArea,
  deleteArea,
} from "@/lib/data/location-admin";

export async function createDistrictAction(payload: { name: string }) {
  const parsed = DistrictSchema.safeParse(payload);
  if (!parsed.success) return { error: "Invalid district" };
  try {
    const district = await createDistrict(parsed.data.name);
    revalidatePath("/fmg-admin/settings");
    return { success: true, district: JSON.parse(JSON.stringify(district)) };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create district" };
  }
}

export async function renameDistrictAction(payload: { id: string; name: string }) {
  const parsed = DistrictSchema.safeParse({ name: payload.name });
  if (!parsed.success) return { error: "Invalid district" };
  try {
    const district = await renameDistrict(payload.id, parsed.data.name);
    revalidatePath("/fmg-admin/settings");
    return { success: true, district: JSON.parse(JSON.stringify(district)) };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to rename district" };
  }
}

export async function deleteDistrictAction(payload: { id: string }) {
  try {
    await deleteDistrict(payload.id);
    revalidatePath("/fmg-admin/settings");
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to delete district" };
  }
}

export async function createAreaAction(payload: { districtId: string; name: string }) {
  const parsed = AreaSchema.safeParse(payload);
  if (!parsed.success) return { error: "Invalid area" };
  try {
    const area = await createArea(parsed.data.districtId, parsed.data.name);
    revalidatePath("/fmg-admin/settings");
    return { success: true, area: JSON.parse(JSON.stringify(area)) };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to create area" };
  }
}

export async function renameAreaAction(payload: { id: string; name: string }) {
  const parsed = DistrictSchema.safeParse({ name: payload.name });
  if (!parsed.success) return { error: "Invalid area" };
  try {
    const area = await renameArea(payload.id, parsed.data.name);
    revalidatePath("/fmg-admin/settings");
    return { success: true, area: JSON.parse(JSON.stringify(area)) };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to rename area" };
  }
}

export async function deleteAreaAction(payload: { id: string }) {
  try {
    await deleteArea(payload.id);
    revalidatePath("/fmg-admin/settings");
    return { success: true };
  } catch (e: any) {
    return { error: e?.message ?? "Failed to delete area" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import CustomerModel from "@/lib/models/customer";
import { findCustomerByMobile, upsertCustomerByMobile } from "@/lib/data/customer";

export async function findCustomerByMobileAction(mobile: string) {
  if (!mobile) return { customer: null };
  const customer = await findCustomerByMobile(mobile);
  return { customer: customer ? JSON.parse(JSON.stringify(customer)) : null };
}

export async function upsertCustomerAction(payload: {
  mobile: string;
  countryCode: string;
  name: string;
  address?: {
    label?: string;
    door: string;
    street: string;
    districtId: string;
    areaId: string;
    isDefault?: boolean;
  };
}) {
  const customer = await upsertCustomerByMobile(payload);
  return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
}

export async function updateCustomerAdminAction(
  id: string,
  data: { name: string; mobile: string }
) {
  await connectDB();
  
  // Check if mobile is taken by another customer
  const existing = await CustomerModel.findOne({ mobile: data.mobile, _id: { $ne: id } });
  if (existing) return { error: "Mobile number already in use by another customer" };

  const customer = await CustomerModel.findByIdAndUpdate(id, data, { new: true });
  if (!customer) return { error: "Customer not found" };
  
  revalidatePath("/fmg-admin/customers");
  return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
}

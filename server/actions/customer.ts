"use server";

import { findCustomerByMobile, upsertCustomerByMobile } from "@/lib/data/customer";

export async function findCustomerByMobileAction(mobile: string) {
  if (!mobile) return { customer: null };
  const customer = await findCustomerByMobile(mobile);
  return { customer };
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
  return { success: true, customer };
}

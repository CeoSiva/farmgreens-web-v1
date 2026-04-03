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

import Papa from "papaparse";
import { listDistricts } from "@/lib/data/location";

export async function bulkUploadCustomersAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file uploaded" };

    const csvText = await file.text();
    if (!csvText.trim()) return { error: "Empty CSV file" };

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error("[CSV Parse Errors]", parsed.errors);
      return { error: "Failed to parse CSV format properly." };
    }

    const rows = parsed.data as Record<string, string>[];
    if (rows.length === 0) return { error: "No data rows found in CSV." };

    await connectDB();
    
    // Fetch and map districts for automatic mapping
    const districts = await listDistricts();
    const districtMap = new Map<string, string>();
    districts.forEach((d: any) => {
      districtMap.set(d.name.toLowerCase().trim(), d._id.toString());
    });

    const bulkOps = [];

    for (const row of rows) {
      // Find possible keys (case-insensitive)
      const keys = Object.keys(row);
      const nameKey = keys.find((k) => k.toLowerCase().includes("name"));
      const phoneKey = keys.find((k) => 
        k.toLowerCase().includes("phone") || 
        k.toLowerCase().includes("mobile") || 
        k.toLowerCase().includes("contact")
      );
      const optInKey = keys.find((k) => k.toLowerCase().includes("whatsapp"));
      const cityKey = keys.find((k) => 
        k.toLowerCase().includes("city") || 
        k.toLowerCase().includes("district") || 
        k.toLowerCase().includes("town")
      );

      const rawName = nameKey ? row[nameKey]?.trim() : "";
      let rawPhone = phoneKey ? row[phoneKey]?.trim() : "";
      const rawOptin = optInKey ? row[optInKey]?.trim().toLowerCase() : "";
      const rawCity = cityKey ? row[cityKey]?.trim().toLowerCase() : "";

      if (!rawPhone) continue;

      // Clean phone number
      const digits = rawPhone.replace(/\D/g, "");
      let countryCode = "+91";
      let mobile = digits;
      
      if (digits.startsWith("91") && digits.length === 12) {
        mobile = digits.slice(2);
      } else if (digits.length === 10) {
        mobile = digits;
      } else {
        if (digits.length < 10) continue; 
        mobile = digits.slice(-10);
      }

      // Determine Opt-in (defaults to true)
      let whatsappOptIn = true;
      if (rawOptin && ["false", "no", "0", "off"].includes(rawOptin)) {
        whatsappOptIn = false;
      }

      // District Mapping
      const districtId = rawCity ? districtMap.get(rawCity) : null;

      const updatePayload: any = {
        $set: {
          mobile,
          countryCode,
          name: rawName || "Customer",
          whatsappOptIn
        }
      };

      // If we found a district, we add it to a default address 
      // ONLY IF the customer is being created for the first time ($setOnInsert)
      // to avoid overwriting existing real addresses for existing customers.
      if (districtId) {
        updatePayload.$setOnInsert = {
          addresses: [{
            door: "TBD",
            street: "TBD",
            districtId: districtId,
            isDefault: true
          }]
        };
      }

      bulkOps.push({
        updateOne: {
          filter: { mobile },
          update: updatePayload,
          upsert: true,
        }
      });
    }

    if (bulkOps.length === 0) {
      return { error: "No valid customer rows found." };
    }

    await CustomerModel.bulkWrite(bulkOps);
    revalidatePath("/fmg-admin/customers");
    
    return { 
      success: true, 
      message: `Successfully uploaded ${bulkOps.length} customers.` 
    };
  } catch (error) {
    console.error("[Bulk Upload Error]", error);
    return { error: "Failed to process bulk upload." };
  }
}


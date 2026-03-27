import { connectDB } from "../db";
import CustomerModel, { ICustomer } from "../models/customer";

export async function findCustomerByMobile(
  mobile: string
): Promise<ICustomer | null> {
  await connectDB();
  return CustomerModel.findOne({ mobile }).lean();
}

export async function upsertCustomerByMobile(data: {
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
}): Promise<ICustomer> {
  await connectDB();

  const update: any = {
    $set: {
      mobile: data.mobile,
      countryCode: data.countryCode,
      name: data.name,
    },
  };

  if (data.address) {
    // Push new address; for v1 we keep it simple and do not dedupe.
    update.$push = {
      addresses: {
        label: data.address.label,
        door: data.address.door,
        street: data.address.street,
        districtId: data.address.districtId,
        areaId: data.address.areaId,
        isDefault: data.address.isDefault ?? true,
      },
    };
  }

  const doc = await CustomerModel.findOneAndUpdate(
    { mobile: data.mobile },
    update,
    { upsert: true, new: true }
  );

  return doc.toObject();
}

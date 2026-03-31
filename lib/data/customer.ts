import { connectDB } from "../db"
import CustomerModel, { ICustomer } from "../models/customer"

export async function findCustomerByMobile(
  mobile: string
): Promise<ICustomer | null> {
  await connectDB()
  return CustomerModel.findOne({ mobile }).lean()
}

export async function upsertCustomerByMobile(data: {
  mobile: string
  countryCode: string
  name: string
  address?: {
    label?: string
    door: string
    street: string
    districtId: string
    areaId: string
    isDefault?: boolean
  }
}): Promise<ICustomer> {
  await connectDB()

  const update: any = {
    $set: {
      mobile: data.mobile,
      countryCode: data.countryCode,
      name: data.name,
    },
  }

  if (data.address) {
    const addrMatch = {
      door: data.address.door,
      street: data.address.street,
      districtId: data.address.districtId,
      areaId: data.address.areaId,
    }

    // Check if customer already has a matching address
    const existing = await CustomerModel.findOne({
      mobile: data.mobile,
      addresses: {
        $elemMatch: {
          door: addrMatch.door,
          street: addrMatch.street,
          districtId: addrMatch.districtId,
          areaId: addrMatch.areaId,
        },
      },
    })

    if (!existing) {
      update.$push = {
        addresses: {
          label: data.address.label,
          door: data.address.door,
          street: data.address.street,
          districtId: data.address.districtId,
          areaId: data.address.areaId,
          isDefault: data.address.isDefault ?? true,
        },
      }
    }
  }

  const doc = await CustomerModel.findOneAndUpdate(
    { mobile: data.mobile },
    update,
    { upsert: true, new: true }
  )

  return doc.toObject()
}

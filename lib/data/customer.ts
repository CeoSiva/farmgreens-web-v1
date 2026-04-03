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
  whatsappOptIn?: boolean
  address?: {
    label?: string
    door: string
    street: string
    districtId: string
    areaId?: string
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

  if (data.whatsappOptIn !== undefined) {
    update.$set.whatsappOptIn = data.whatsappOptIn
  }

  if (data.address) {
    const addrMatch: any = {
      door: data.address.door,
      street: data.address.street,
      districtId: data.address.districtId,
    }
    if (data.address.areaId) {
      addrMatch.areaId = data.address.areaId
    }

    // Check if customer already has a matching address
    const existing = await CustomerModel.findOne({
      mobile: data.mobile,
      addresses: {
        $elemMatch: addrMatch,
      },
    })

    if (!existing) {
      const newAddr: any = {
        label: data.address.label,
        door: data.address.door,
        street: data.address.street,
        districtId: data.address.districtId,
        isDefault: data.address.isDefault ?? true,
      }
      if (data.address.areaId) {
        newAddr.areaId = data.address.areaId
      }
      update.$push = {
        addresses: newAddr,
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

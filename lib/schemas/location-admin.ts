import { z } from "zod"

export const DistrictSchema = z.object({
  name: z.string().min(1, "District name is required"),
  isCodEnabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  hasApartments: z.boolean().optional(),
  deliveryCenter: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  deliveryRadius: z.number().optional(),
})

export const AreaSchema = z.object({
  districtId: z.string().min(1, "District is required"),
  name: z.string().min(1, "Area name is required"),
  pincode: z.string().optional(),
  isEnabled: z.boolean().optional(),
})

export const ApartmentSchema = z.object({
  districtId: z.string().min(1, "District is required"),
  name: z.string().min(1, "Apartment name is required"),
  deliveryDays: z.array(z.number().min(0).max(6)).default([]),
  isCodEnabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
})

export type DistrictValues = z.infer<typeof DistrictSchema>
export type AreaValues = z.infer<typeof AreaSchema>
export type ApartmentValues = z.infer<typeof ApartmentSchema>

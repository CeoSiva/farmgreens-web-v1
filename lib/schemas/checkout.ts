import { z } from "zod"

export const CheckoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  countryCode: z.string().min(1, "Country code is required"),
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number is too long")
    .regex(/^\d+$/, "Mobile number must contain only digits"),
  door: z.string().min(1, "Door/Flat is required"),
  street: z.string().min(1, "Street is required"),
  districtId: z.string().min(1, "District is required"),
  areaId: z.string().optional(),
  saveDetails: z.boolean(),
})

export type CheckoutFormValues = z.infer<typeof CheckoutSchema>

import { z } from "zod"

export const CheckoutSchema = z
  .object({
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
    whatsappOptIn: z.boolean(),
    lat: z
      .number("Please pin your delivery location on the map")
      .min(-90, "Invalid latitude")
      .max(90, "Invalid latitude"),
    lng: z
      .number("Please pin your delivery location on the map")
      .min(-180, "Invalid longitude")
      .max(180, "Invalid longitude"),
    paymentMethod: z.enum(["cod", "online"], "Please select a payment method"),
  })
  .refine(
    (data) => {
      if (!data.street && !data.areaId) {
        return false
      }
      return true
    },
    {
      message: "Please select an area when not selecting an apartment",
      path: ["areaId"],
    }
  )

export type CheckoutFormValues = z.infer<typeof CheckoutSchema>

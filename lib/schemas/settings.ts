import { z } from "zod";

export const StoreProfileSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  supportPhone: z.string().optional().or(z.literal("")),
  supportWhatsapp: z.string().optional().or(z.literal("")),
  storeAddress: z.string().optional().or(z.literal("")),
});

export const DeliveryFeeSchema = z.object({
  deliveryFee: z.coerce.number().min(0, "Delivery fee must be >= 0"),
});

export type StoreProfileValues = z.infer<typeof StoreProfileSchema>;
export type DeliveryFeeValues = z.infer<typeof DeliveryFeeSchema>;

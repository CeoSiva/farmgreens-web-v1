import { z } from "zod";

export const ProductOrderQuantitySchema = z.object({
  type: z.enum(["weight", "count"]),
  unit: z.string().min(1, "Unit is required"),
});

export const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.enum(["vegetable", "batter", "greens"]).default("vegetable"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  orderQuantity: ProductOrderQuantitySchema,
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

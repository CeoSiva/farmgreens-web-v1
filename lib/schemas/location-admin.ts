import { z } from "zod";

export const DistrictSchema = z.object({
  name: z.string().min(1, "District name is required"),
});

export const AreaSchema = z.object({
  districtId: z.string().min(1, "District is required"),
  name: z.string().min(1, "Area name is required"),
});

export type DistrictValues = z.infer<typeof DistrictSchema>;
export type AreaValues = z.infer<typeof AreaSchema>;

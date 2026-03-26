import { z } from "zod";

export const LoginSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number is too long")
    .regex(/^\d+$/, "Mobile number must contain only digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

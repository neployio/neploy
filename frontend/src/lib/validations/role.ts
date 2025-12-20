import * as z from "zod";

export const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

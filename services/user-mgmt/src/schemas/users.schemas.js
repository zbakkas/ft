import { z } from "zod";

export const updateUserSchema = z
  .object({
    bio: z.string({ message: "BIO_STRING" }).max(256, "BIO_MAX_256").optional(),
    language: z.enum(["eng", "fr"]).optional(),
  })
  .strict();

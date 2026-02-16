import z from "zod";

export const setup2FASchema = z
  .object({
    method: z.enum(["totp"]),
    email: z.string().email().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.method === "email") return !!data.email;
      return true;
    },
    { message: "email is required for email method" }
  );

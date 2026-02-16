import { z } from "zod";

export const registerUserSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).regex(/^\S*$/, "Must not contain spaces"),
    password: z.string().min(8, "Password must be at least 8 characters")
        .max(64, "Password must not exceed 64 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/\d/, "Must contain at least one number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
        .regex(/^\S*$/, "Must not contain spaces"),
    confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters")
        .max(64, "Password must not exceed 64 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/\d/, "Must contain at least one number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
        .regex(/^\S*$/, "Must not contain spaces"),
}).strict()

export const refreshTokenSchema = z.object({
    refreshToken: z.string().uuid()
}).strict()

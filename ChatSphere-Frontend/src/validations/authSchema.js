import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or mobile number is required")
    .refine((value) => value.includes("@")
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      : /^\+[1-9][0-9]{7,14}$/.test(value.replace(/[\s()-]/g, "").replace(/^00/, "+")),
    "Enter a valid email or mobile number with country code (e.g. +919876543210)"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Name should contain at least 3 characters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid Email"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    mobile: z.string().trim().transform((value) => value.replace(/[\s()-]/g, "").replace(/^00/, "+"))
      .refine((value) => /^\+[1-9][0-9]{7,14}$/.test(value), "Mobile number with country code is required (e.g. +919876543210)"),

    confirmPassword: z
      .string()
      .min(6, "Confirm Password is required"),
      gender: z
      .string()
      .min(1, "Please select your gender"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
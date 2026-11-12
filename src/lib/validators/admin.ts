import { z } from "zod"

export const investmentPlanSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  minimumAmount: z.number().positive("Minimum amount must be positive"),
  maximumAmount: z.number().positive("Maximum amount must be positive"),
  interestRate: z
    .number()
    .min(0, "Interest rate must be positive")
    .max(100, "Interest rate cannot exceed 100%"),
  durationDays: z.number().int().positive("Duration must be positive"),
  status: z.enum(["active", "inactive"]).optional(),
})

export const paymentMethodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["crypto", "bank_transfer", "e_wallet", "other"]),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters"),
  details: z.record(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export const siteSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional(),
  category: z.string().optional(),
})

export const emailTemplateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  variables: z.array(z.string()).optional(),
})

export type InvestmentPlanInput = z.infer<typeof investmentPlanSchema>
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>
export type SiteSettingInput = z.infer<typeof siteSettingSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>

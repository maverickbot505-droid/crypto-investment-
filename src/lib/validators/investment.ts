import { z } from "zod"

export const createInvestmentSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
})

export const depositSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(10, "Minimum deposit is $10"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
})

export const withdrawalSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(1, "Minimum withdrawal is $1"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  walletAddress: z.string().optional(),
  accountDetails: z.string().optional(),
})

export const kycStep1Schema = z.object({
  documentType: z.enum(["passport", "national_id", "drivers_license"], {
    required_error: "Document type is required",
  }),
  documentNumber: z.string().min(1, "Document number is required"),
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
})

export const kycCreateSchema = z.object({
  documentType: z.enum(["passport", "national_id", "drivers_license"]),
  documentNumber: z.string().min(1),
  fullName: z.string().min(2),
  dateOfBirth: z.string().min(1),
  nationality: z.string().min(1),
  frontImage: z.string().min(1, "Front image is required"),
  backImage: z.string().optional(),
  selfieImage: z.string().optional(),
})

export const kycAdminSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type DepositInput = z.infer<typeof depositSchema>
export type WithdrawalInput = z.infer<typeof withdrawalSchema>
export type KycStep1Input = z.infer<typeof kycStep1Schema>
export type KycCreateInput = z.infer<typeof kycCreateSchema>
export type KycAdminInput = z.infer<typeof kycAdminSchema>

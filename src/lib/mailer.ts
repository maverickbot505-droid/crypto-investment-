import nodemailer from "nodemailer"
import { prisma } from "./prisma"

type TemplateType =
  | "WELCOME"
  | "VERIFY_EMAIL"
  | "RESET_PASSWORD"
  | "DEPOSIT_CONFIRMED"
  | "WITHDRAWAL_CONFIRMED"
  | "INVESTMENT_ACTIVATED"
  | "INVESTMENT_COMPLETED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "TWO_FACTOR_CODE"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_UNSUSPENDED"
  | "REFERRAL_CREDIT"
  | "LOGIN_NOTIFICATION"

const fallbackSubjects: Record<string, string> = {
  WELCOME: "Welcome to InvestPro!",
  VERIFY_EMAIL: "Verify Your Email",
  RESET_PASSWORD: "Password Reset Code",
  DEPOSIT_CONFIRMED: "Deposit Confirmed",
  WITHDRAWAL_CONFIRMED: "Withdrawal Confirmed",
  LOGIN_NOTIFICATION: "New Login Detected",
}

const fallbackBodies: Record<string, (vars: Record<string, string>) => string> = {
  WELCOME: (v) => `Hi ${v.firstName},\n\nWelcome to InvestPro! Your account has been created successfully.\n\nStart investing today and grow your wealth.\n\nBest,\nInvestPro Team`,
  RESET_PASSWORD: (v) => `Your password reset code is: ${v.code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
  DEPOSIT_CONFIRMED: (v) => `Hi ${v.firstName},\n\nYour deposit of $${v.amount} has been confirmed.\n\nBest,\nInvestPro Team`,
  WITHDRAWAL_CONFIRMED: (v) => `Hi ${v.firstName},\n\nYour withdrawal of $${v.amount} has been processed.\n\nBest,\nInvestPro Team`,
  LOGIN_NOTIFICATION: (v) => `Hi ${v.firstName},\n\nA new login was detected on your account.\n\nIf this was you, no action is needed. If not, please secure your account immediately.`,
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export async function sendEmail(
  to: string,
  templateType: TemplateType,
  variables: Record<string, string> = {}
) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10)
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(`[mailer] SMTP not configured, skipping email to ${to} (template: ${templateType})`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  const template = await prisma.emailTemplate.findUnique({
    where: { type: templateType as any },
  })

  const subject = template ? interpolate(template.subject, variables) : (fallbackSubjects[templateType] ?? templateType)
  const body = template
    ? interpolate(template.body, variables)
    : (fallbackBodies[templateType]?.(variables) ?? "")

  const htmlBody = body.replace(/\n/g, "<br>")

  await transporter.sendMail({
    from: `"InvestPro" <${smtpUser}>`,
    to,
    subject,
    text: body,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${htmlBody}</div>`,
  })
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/auth"
import { sendEmail } from "@/lib/mailer"
import { z } from "zod"
import { generateReferralCode } from "@/lib/utils"

const apiSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = apiSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, phone, referralCode } = validation.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const code = generateReferralCode()

    let referredById: string | undefined
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } })
      if (referrer) {
        referredById = referrer.id
      }
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        referralCode: code,
        referredBy: referredById,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        referralCode: true,
        createdAt: true,
      },
    })

    sendEmail(user.email, "WELCOME", { firstName: user.firstName, email: user.email }).catch(console.warn)

    return NextResponse.json(
      { message: "Registration successful", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

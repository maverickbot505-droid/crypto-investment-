import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/auth"
import { resetPasswordSchema } from "@/lib/validators/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    const otp = await prisma.oTP.findFirst({
      where: {
        code: token,
        type: "PASSWORD_RESET",
        used: false,
        expiresAt: { gte: new Date() },
      },
    })

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: otp.userId },
        data: { passwordHash },
      }),
      prisma.oTP.update({
        where: { id: otp.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

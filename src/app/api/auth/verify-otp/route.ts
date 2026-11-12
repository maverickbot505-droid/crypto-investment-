import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { code, email, type } = await req.json()

    if (!code || !email || !type) {
      return NextResponse.json(
        { error: "Missing required fields: code, email, type" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        code,
        type,
        expiresAt: { gte: new Date() },
        used: false,
      },
    })

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      )
    }

    await prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true },
    })

    return NextResponse.json(
      { message: "OTP verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

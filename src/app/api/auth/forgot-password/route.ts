import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOTP } from "@/lib/utils"
import { sendEmail } from "@/lib/mailer"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const code = generateOTP(6)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await prisma.oTP.create({
        data: {
          userId: user.id,
          code,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      })

      sendEmail(user.email, "RESET_PASSWORD", { code, firstName: user.firstName }).catch(console.warn)
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset code has been sent",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

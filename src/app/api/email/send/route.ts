import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/mailer"
import { requireAdmin } from "@/lib/auth/auth"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { to, templateType, variables } = await req.json()

    if (!to || !templateType) {
      return NextResponse.json({ error: "Missing required fields: to, templateType" }, { status: 400 })
    }

    await sendEmail(to, templateType, variables || {})

    return NextResponse.json({ message: "Email sent" }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Admin access required" ? 403 : 401 })
    }
    console.error("Email send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

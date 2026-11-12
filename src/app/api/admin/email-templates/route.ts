import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function GET() {
  try {
    await requireAdmin()

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: "asc" },
    })

    return NextResponse.json({ templates }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin email templates GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { type, subject, body: templateBody } = body

    if (!type || !subject || !templateBody) {
      return NextResponse.json(
        { error: "Missing required fields: type, subject, body" },
        { status: 400 }
      )
    }

    const existing = await prisma.emailTemplate.findUnique({
      where: { type },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A template with this type already exists" },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: { type, subject, body: templateBody },
    })

    return NextResponse.json(
      { message: "Email template created", template },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin email templates POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

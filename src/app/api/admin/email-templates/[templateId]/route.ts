import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    await requireAdmin()

    const { templateId } = params
    const body = await req.json()

    const existing = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}

    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.body !== undefined) updateData.body = body.body
    if (body.type !== undefined) updateData.type = body.type

    const template = await prisma.emailTemplate.update({
      where: { id: templateId },
      data: updateData,
    })

    return NextResponse.json(
      { message: "Email template updated", template },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin email template PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

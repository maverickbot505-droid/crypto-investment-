import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    await requireAdmin()

    const { planId } = params
    const body = await req.json()

    const existing = await prisma.investmentPlan.findUnique({
      where: { id: planId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Investment plan not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.badge !== undefined) updateData.badge = body.badge
    if (body.minAmount !== undefined) updateData.minAmount = body.minAmount
    if (body.maxAmount !== undefined) updateData.maxAmount = body.maxAmount
    if (body.durationDays !== undefined) updateData.durationDays = body.durationDays
    if (body.roiPercent !== undefined) updateData.roiPercent = body.roiPercent
    if (body.dailyRoiPercent !== undefined) updateData.dailyRoiPercent = body.dailyRoiPercent
    if (body.referralBonus !== undefined) updateData.referralBonus = body.referralBonus
    if (body.description !== undefined) updateData.description = body.description
    if (body.features !== undefined) updateData.features = body.features
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder

    const plan = await prisma.investmentPlan.update({
      where: { id: planId },
      data: updateData,
    })

    return NextResponse.json(
      { message: "Investment plan updated", plan },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin plan update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    await requireAdmin()

    const { planId } = params

    const existing = await prisma.investmentPlan.findUnique({
      where: { id: planId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Investment plan not found" },
        { status: 404 }
      )
    }

    const plan = await prisma.investmentPlan.update({
      where: { id: planId },
      data: { isActive: false },
    })

    return NextResponse.json(
      { message: "Investment plan deactivated", plan },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin plan delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

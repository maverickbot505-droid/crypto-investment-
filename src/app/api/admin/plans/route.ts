import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function GET() {
  try {
    await requireAdmin()

    const plans = await prisma.investmentPlan.findMany({
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ plans }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin plans list error:", error)
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
    const {
      name,
      badge,
      minAmount,
      maxAmount,
      durationDays,
      roiPercent,
      dailyRoiPercent,
      referralBonus,
      description,
      features,
      sortOrder,
    } = body

    if (!name || minAmount === undefined || !durationDays || roiPercent === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, minAmount, durationDays, roiPercent" },
        { status: 400 }
      )
    }

    const plan = await prisma.investmentPlan.create({
      data: {
        name,
        badge: badge || null,
        minAmount,
        maxAmount: maxAmount || null,
        durationDays,
        roiPercent,
        dailyRoiPercent: dailyRoiPercent || null,
        referralBonus: referralBonus ?? 5,
        description: description || null,
        features: features || [],
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json(
      { message: "Investment plan created", plan },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin plans create error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/auth"
import { createInvestmentSchema } from "@/lib/validators/investment"

export async function GET() {
  try {
    const sessionUser = await requireAuth()

    const investments = await prisma.investment.findMany({
      where: { userId: sessionUser.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ investments }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Investments GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireAuth()

    const body = await req.json()
    const validation = createInvestmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { planId, amount, paymentMethodId } = validation.data

    const plan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Investment plan not found or inactive" },
        { status: 404 }
      )
    }

    if (amount < Number(plan.minAmount)) {
      return NextResponse.json(
        { error: `Minimum investment amount is $${plan.minAmount}` },
        { status: 400 }
      )
    }

    if (plan.maxAmount && amount > Number(plan.maxAmount)) {
      return NextResponse.json(
        { error: `Maximum investment amount is $${plan.maxAmount}` },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    })

    if (!user || Number(user.balance) < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      )
    }

    const expectedReturn = amount * (1 + Number(plan.roiPercent) / 100)
    const dailyEarning = Number(plan.dailyRoiPercent)
      ? (amount * Number(plan.dailyRoiPercent)) / 100
      : (expectedReturn - amount) / plan.durationDays

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.durationDays)

    const result = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.create({
        data: {
          userId: user.id,
          planId: plan.id,
          amount,
          expectedReturn,
          dailyEarning: Math.round(dailyEarning * 100) / 100,
          endDate,
          status: "ACTIVE",
        },
      })

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "INVESTMENT",
          amount,
          status: "APPROVED",
          method: paymentMethodId,
          note: `Investment in ${plan.name}`,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amount },
          totalInvested: { increment: amount },
        },
      })

      return investment
    })

    return NextResponse.json(
      { message: "Investment created successfully", investment: result },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Investments POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

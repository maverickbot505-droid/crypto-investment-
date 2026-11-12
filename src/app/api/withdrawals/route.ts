import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/auth"
import { withdrawalSchema } from "@/lib/validators/investment"

export async function GET() {
  try {
    const sessionUser = await requireAuth()

    const withdrawals = await prisma.transaction.findMany({
      where: { userId: sessionUser.id, type: "WITHDRAWAL" },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ withdrawals }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Withdrawals GET error:", error)
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
    const validation = withdrawalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { amount, paymentMethodId, walletAddress, accountDetails } = validation.data

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.kycStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "KYC approval required to make withdrawals" },
        { status: 403 }
      )
    }

    const fee = Math.round(amount * 0.01 * 100) / 100
    const totalDeduction = amount + fee

    if (Number(user.balance) < totalDeduction) {
      return NextResponse.json(
        { error: "Insufficient balance to cover withdrawal amount and fee" },
        { status: 400 }
      )
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          status: "PENDING",
          method: paymentMethodId,
          fee,
          accountDetails: accountDetails || walletAddress,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: totalDeduction },
        },
      })

      return transaction
    })

    return NextResponse.json(
      { message: "Withdrawal request submitted", withdrawal },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Withdrawals POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

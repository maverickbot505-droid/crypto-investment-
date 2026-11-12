import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/auth"
import { depositSchema } from "@/lib/validators/investment"

export async function GET() {
  try {
    const sessionUser = await requireAuth()

    const deposits = await prisma.transaction.findMany({
      where: { userId: sessionUser.id, type: "DEPOSIT" },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ deposits }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Deposits GET error:", error)
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
    const validation = depositSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { amount, paymentMethodId, transactionId } = validation.data

    const deposit = await prisma.transaction.create({
      data: {
        userId: sessionUser.id,
        type: "DEPOSIT",
        amount,
        status: "PENDING",
        method: paymentMethodId,
        proofUrl: transactionId,
      },
    })

    return NextResponse.json(
      { message: "Deposit request submitted", deposit },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Deposits POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

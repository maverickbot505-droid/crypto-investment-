import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function GET() {
  try {
    await requireAdmin()

    const methods = await prisma.paymentMethod.findMany({
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ paymentMethods: methods }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin payment methods GET error:", error)
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
    const { type, label, instructions, walletAddress, bankDetails, sortOrder, isActive } = body

    if (!type || !label) {
      return NextResponse.json(
        { error: "Missing required fields: type, label" },
        { status: 400 }
      )
    }

    const method = await prisma.paymentMethod.create({
      data: {
        type,
        label,
        instructions: instructions || null,
        walletAddress: walletAddress || null,
        bankDetails: bankDetails || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(
      { message: "Payment method created", paymentMethod: method },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin payment methods POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

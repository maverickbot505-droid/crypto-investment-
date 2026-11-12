import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: { methodId: string } }
) {
  try {
    await requireAdmin()

    const { methodId } = params
    const body = await req.json()

    const existing = await prisma.paymentMethod.findUnique({
      where: { id: methodId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}

    if (body.type !== undefined) updateData.type = body.type
    if (body.label !== undefined) updateData.label = body.label
    if (body.instructions !== undefined) updateData.instructions = body.instructions
    if (body.walletAddress !== undefined) updateData.walletAddress = body.walletAddress
    if (body.bankDetails !== undefined) updateData.bankDetails = body.bankDetails
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const method = await prisma.paymentMethod.update({
      where: { id: methodId },
      data: updateData,
    })

    return NextResponse.json(
      { message: "Payment method updated", paymentMethod: method },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin payment method PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { methodId: string } }
) {
  try {
    await requireAdmin()

    const { methodId } = params

    const existing = await prisma.paymentMethod.findUnique({
      where: { id: methodId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      )
    }

    await prisma.paymentMethod.delete({
      where: { id: methodId },
    })

    return NextResponse.json(
      { message: "Payment method deleted" },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin payment method DELETE error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

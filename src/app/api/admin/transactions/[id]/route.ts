import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin()
    const { id } = params

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    await prisma.$transaction(async (prismaTx) => {
      if (tx.status === "APPROVED") {
        if (tx.type === "ADMIN_CREDIT") {
          await prismaTx.user.update({ where: { id: tx.userId }, data: { balance: { decrement: tx.amount } } })
        } else if (tx.type === "ADMIN_DEBIT") {
          await prismaTx.user.update({ where: { id: tx.userId }, data: { balance: { increment: tx.amount } } })
        }
      }

      await prismaTx.transaction.delete({ where: { id } })

      await prismaTx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `Deleted ${tx.type} transaction for ${tx.user.email}`,
          targetUserId: tx.userId,
          details: `Amount: ${tx.amount}, previous status: ${tx.status}`,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        },
      })
    })

    return NextResponse.json({ message: "Transaction deleted" }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Admin access required" ? 403 : 401 })
    }
    console.error("Admin delete transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { userId, type, amount, status, method, note } = await req.json()

    if (!userId || !type || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields: userId, type, amount" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const tx = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount,
          status: status || "APPROVED",
          method: method || "admin",
          note: note || `Admin ${type.toLowerCase().replace("_", " ")} by ${admin.email}`,
          processedBy: admin.id,
          processedAt: new Date(),
        },
      })

      if (status === "APPROVED" || !status) {
        if (type === "ADMIN_CREDIT") {
          await tx.user.update({ where: { id: userId }, data: { balance: { increment: amount } } })
        } else if (type === "ADMIN_DEBIT") {
          await tx.user.update({ where: { id: userId }, data: { balance: { decrement: amount } } })
        }
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `Created ${type} transaction for ${user.email}`,
          targetUserId: userId,
          details: `Amount: ${amount}. Status: ${status || "APPROVED"}`,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        },
      })

      return transaction
    })

    return NextResponse.json({ message: "Transaction created", transaction: tx }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Admin access required" ? 403 : 401 })
    }
    console.error("Admin create transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    await requireAdmin()
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    })
    return NextResponse.json({ transactions }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Admin access required" ? 403 : 401 })
    }
    console.error("Admin list transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

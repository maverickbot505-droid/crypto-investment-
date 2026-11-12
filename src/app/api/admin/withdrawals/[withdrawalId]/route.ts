import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"
import { sendEmail } from "@/lib/mailer"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { withdrawalId: string } }
) {
  try {
    const admin = await requireAdmin()

    const { withdrawalId } = params
    const { status, note } = await req.json()

    if (!status || !["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be APPROVED, REJECTED, or CANCELLED" },
        { status: 400 }
      )
    }

    const withdrawal = await prisma.transaction.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    })

    if (!withdrawal || withdrawal.type !== "WITHDRAWAL") {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      )
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Withdrawal has already been processed" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: withdrawalId },
        data: {
          status,
          note: note || undefined,
          processedBy: admin.id,
          processedAt: new Date(),
        },
      })

      if (status === "REJECTED" || status === "CANCELLED") {
        const totalRefund = Number(withdrawal.amount) + Number(withdrawal.fee)

        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: totalRefund } },
        })
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `Withdrawal ${status} for ${withdrawal.user.email}`,
          targetUserId: withdrawal.userId,
          details: `Amount: ${withdrawal.amount}. ${note || ""}`.trim(),
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        },
      })

      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          title: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your withdrawal of $${withdrawal.amount} has been ${status}.${note ? ` Note: ${note}` : ""}`,
          type: status === "APPROVED" ? "SUCCESS" : "ERROR",
        },
      })

      return updated
    })

    if (status === "APPROVED") {
      sendEmail(withdrawal.user.email, "WITHDRAWAL_CONFIRMED", {
        firstName: withdrawal.user.firstName, amount: String(withdrawal.amount),
      }).catch(console.warn)
    }

    return NextResponse.json(
      { message: `Withdrawal ${status}`, withdrawal: result },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin withdrawal review error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

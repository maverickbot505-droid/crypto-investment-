import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"
import { sendEmail } from "@/lib/mailer"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { depositId: string } }
) {
  try {
    const admin = await requireAdmin()

    const { depositId } = params
    const { status, note } = await req.json()

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 }
      )
    }

    const deposit = await prisma.transaction.findUnique({
      where: { id: depositId },
      include: { user: true },
    })

    if (!deposit || deposit.type !== "DEPOSIT") {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      )
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json(
        { error: "Deposit has already been processed" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: depositId },
        data: {
          status,
          note: note || undefined,
          processedBy: admin.id,
          processedAt: new Date(),
        },
      })

      if (status === "APPROVED") {
        await tx.user.update({
          where: { id: deposit.userId },
          data: { balance: { increment: deposit.amount } },
        })
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `Deposit ${status} for ${deposit.user.email}`,
          targetUserId: deposit.userId,
          details: `Amount: ${deposit.amount}. ${note || ""}`.trim(),
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        },
      })

      await tx.notification.create({
        data: {
          userId: deposit.userId,
          title: `Deposit ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your deposit of $${deposit.amount} has been ${status}.${note ? ` Note: ${note}` : ""}`,
          type: status === "APPROVED" ? "SUCCESS" : "ERROR",
        },
      })

      return updated
    })

    if (status === "APPROVED") {
      sendEmail(deposit.user.email, "DEPOSIT_CONFIRMED", {
        firstName: deposit.user.firstName, amount: String(deposit.amount),
      }).catch(console.warn)
    }

    return NextResponse.json(
      { message: `Deposit ${status}`, deposit: result },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin deposit review error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

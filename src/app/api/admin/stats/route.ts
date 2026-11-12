import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function GET() {
  try {
    await requireAdmin()

    const [
      totalUsers,
      totalInvestedResult,
      totalWithdrawnResult,
      totalEarningsResult,
      pendingKyc,
      pendingDeposits,
      pendingWithdrawals,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { totalInvested: true } }),
      prisma.user.aggregate({ _sum: { totalWithdrawn: true } }),
      prisma.user.aggregate({ _sum: { totalEarned: true } }),
      prisma.kYC.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
      prisma.transaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          admin: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ])

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalInvested: totalInvestedResult._sum.totalInvested ?? 0,
          totalWithdrawn: totalWithdrawnResult._sum.totalWithdrawn ?? 0,
          totalEarnings: totalEarningsResult._sum.totalEarned ?? 0,
          pendingKyc,
          pendingDeposits,
          pendingWithdrawals,
        },
        recentAuditLogs,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

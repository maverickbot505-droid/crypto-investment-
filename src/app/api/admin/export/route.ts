import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

function escapeCSV(val: unknown): string {
  const str = val == null ? "" : String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(",")
  const bodyLines = rows.map((row) => row.map(escapeCSV).join(","))
  return [headerLine, ...bodyLines].join("\r\n")
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "transactions"
    const status = searchParams.get("status") || undefined

    switch (type) {
      case "transactions": {
        const where: any = {}
        if (status) where.status = status
        const data = await prisma.transaction.findMany({
          where,
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        })
        const csv = toCSV(
          ["ID", "User", "Email", "Type", "Amount", "Status", "Method", "Note", "Created"],
          data.map((t) => [
            t.id, `${t.user.firstName} ${t.user.lastName}`, t.user.email,
            t.type, String(t.amount), t.status, t.method || "", t.note || "",
            t.createdAt.toISOString(),
          ])
        )
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="transactions-${Date.now()}"`,
          },
        })
      }

      case "deposits": {
        const where: any = { type: "DEPOSIT" }
        if (status) where.status = status
        const data = await prisma.transaction.findMany({
          where,
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        })
        const csv = toCSV(
          ["ID", "User", "Email", "Amount", "Status", "Method", "Note", "Created"],
          data.map((t) => [
            t.id, `${t.user.firstName} ${t.user.lastName}`, t.user.email,
            String(t.amount), t.status, t.method || "", t.note || "",
            t.createdAt.toISOString(),
          ])
        )
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="deposits-${Date.now()}"`,
          },
        })
      }

      case "withdrawals": {
        const where: any = { type: "WITHDRAWAL" }
        if (status) where.status = status
        const data = await prisma.transaction.findMany({
          where,
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        })
        const csv = toCSV(
          ["ID", "User", "Email", "Amount", "Status", "Method", "Account", "Note", "Created"],
          data.map((t) => [
            t.id, `${t.user.firstName} ${t.user.lastName}`, t.user.email,
            String(t.amount), t.status, t.method || "", t.accountDetails || "", t.note || "",
            t.createdAt.toISOString(),
          ])
        )
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="withdrawals-${Date.now()}"`,
          },
        })
      }

      case "users": {
        const data = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true, email: true, firstName: true, lastName: true, role: true,
            kycStatus: true, balance: true, totalInvested: true, totalEarned: true,
            totalWithdrawn: true, isSuspended: true, createdAt: true,
          },
        })
        const csv = toCSV(
          ["ID", "Email", "First Name", "Last Name", "Role", "KYC", "Balance", "Invested", "Earned", "Withdrawn", "Suspended", "Created"],
          data.map((u) => [
            u.id, u.email, u.firstName, u.lastName, u.role, u.kycStatus,
            String(u.balance), String(u.totalInvested), String(u.totalEarned),
            String(u.totalWithdrawn), String(u.isSuspended), u.createdAt.toISOString(),
          ])
        )
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="users-${Date.now()}"`,
          },
        })
      }

      default:
        return NextResponse.json({ error: "Invalid type. Use: transactions, deposits, withdrawals, users" }, { status: 400 })
    }
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Admin access required" ? 403 : 401 })
    }
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

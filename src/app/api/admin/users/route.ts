import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const kycStatus = searchParams.get("kycStatus")

    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (role) {
      where.role = role as any
    }

    if (kycStatus) {
      where.kycStatus = kycStatus as any
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        balance: true,
        totalInvested: true,
        totalEarned: true,
        isSuspended: true,
        createdAt: true,
        _count: {
          select: {
            investments: true,
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json({ users }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

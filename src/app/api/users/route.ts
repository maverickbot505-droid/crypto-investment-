import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/auth"

export async function GET() {
  try {
    const sessionUser = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        kycStatus: true,
        balance: true,
        totalInvested: true,
        totalEarned: true,
        totalWithdrawn: true,
        referralCode: true,
        referralEarnings: true,
        isTwoFactorEnabled: true,
        isSuspended: true,
        createdAt: true,
        _count: {
          select: { referralUsers: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        user: {
          ...user,
          referralCount: user._count.referralUsers,
          _count: undefined,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("Users GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin()

    const { userId } = params
    const body = await req.json()

    const { balance, role, isSuspended, suspensionReason, firstName, lastName, email, password } = body

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}

    if (balance !== undefined) updateData.balance = balance
    if (role !== undefined) updateData.role = role
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (password) {
      const { hashPassword } = await import("@/lib/auth/auth")
      updateData.passwordHash = await hashPassword(password)
    }
    if (isSuspended !== undefined) {
      updateData.isSuspended = isSuspended
      updateData.suspensionReason = isSuspended ? (suspensionReason || null) : null
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        balance: true,
        isSuspended: true,
        kycStatus: true,
      },
    })

    const changes: string[] = []
    if (balance !== undefined) changes.push(`balance set to ${balance}`)
    if (role !== undefined) changes.push(`role changed to ${role}`)
    if (firstName !== undefined) changes.push(`name updated`)
    if (lastName !== undefined) changes.push(`name updated`)
    if (email !== undefined) changes.push(`email changed to ${email}`)
    if (password) changes.push(`password reset`)
    if (isSuspended !== undefined) changes.push(isSuspended ? "account suspended" : "account unsuspended")

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: `Updated user ${user.email}`,
        targetUserId: userId,
        details: changes.join(", "),
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      },
    })

    return NextResponse.json(
      { message: "User updated", user: updatedUser },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin user PATCH error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

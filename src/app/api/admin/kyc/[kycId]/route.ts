import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"
import { kycAdminSchema } from "@/lib/validators/investment"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { kycId: string } }
) {
  try {
    const admin = await requireAdmin()

    const { kycId } = params
    const body = await req.json()
    const validation = kycAdminSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, adminNote } = validation.data

    const kyc = await prisma.kYC.findUnique({
      where: { id: kycId },
      include: { user: true },
    })

    if (!kyc) {
      return NextResponse.json(
        { error: "KYC record not found" },
        { status: 404 }
      )
    }

    if (kyc.status !== "PENDING") {
      return NextResponse.json(
        { error: "KYC has already been reviewed" },
        { status: 400 }
      )
    }

    const updatedKyc = await prisma.$transaction(async (tx) => {
      const kycStatus = status === "approved" ? "APPROVED" : "REJECTED"

      const updated = await tx.kYC.update({
        where: { id: kycId },
        data: {
          status: kycStatus,
          reviewNote: adminNote || null,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: kyc.userId },
        data: { kycStatus },
      })

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: `KYC ${status} for ${kyc.user.email}`,
          targetUserId: kyc.userId,
          details: adminNote || undefined,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        },
      })

      await tx.notification.create({
        data: {
          userId: kyc.userId,
          title: `KYC ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: adminNote
            ? `Your KYC verification has been ${status}. Note: ${adminNote}`
            : `Your KYC verification has been ${status}.`,
          type: status === "approved" ? "SUCCESS" : "ERROR",
        },
      })

      return updated
    })

    return NextResponse.json(
      { message: `KYC ${status}`, kyc: updatedKyc },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin KYC review error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

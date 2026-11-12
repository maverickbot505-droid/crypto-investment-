import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/auth"
import { kycCreateSchema } from "@/lib/validators/investment"

export async function GET() {
  try {
    const sessionUser = await requireAuth()

    const kyc = await prisma.kYC.findUnique({
      where: { userId: sessionUser.id },
    })

    return NextResponse.json({ kyc }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("KYC GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireAuth()

    const body = await req.json()
    const validation = kycCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { documentType, fullName, dateOfBirth, nationality, frontImage, backImage, selfieImage } = validation.data

    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const kyc = await prisma.kYC.upsert({
      where: { userId: sessionUser.id },
      update: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        idType: documentType,
        idFrontUrl: frontImage,
        idBackUrl: backImage,
        selfieUrl: selfieImage,
        status: "PENDING",
      },
      create: {
        userId: sessionUser.id,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        idType: documentType,
        idFrontUrl: frontImage,
        idBackUrl: backImage,
        selfieUrl: selfieImage,
        status: "PENDING",
      },
    })

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { kycStatus: "PENDING" },
    })

    return NextResponse.json(
      { message: "KYC submitted successfully", kyc },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    console.error("KYC POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

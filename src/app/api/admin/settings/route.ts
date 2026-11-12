import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/auth"

export async function GET() {
  try {
    await requireAdmin()

    const settings = await prisma.siteSetting.findMany()
    const settingsMap: Record<string, string> = {}

    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({ settings: settingsMap }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin settings GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { settings } = body

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: "settings must be an array of { key, value } objects" },
        { status: 400 }
      )
    }

    for (const s of settings) {
      if (!s.key || s.value === undefined) {
        return NextResponse.json(
          { error: "Each setting must have a key and value" },
          { status: 400 }
        )
      }

      await prisma.siteSetting.upsert({
        where: { key: s.key },
        update: { value: String(s.value) },
        create: { key: s.key, value: String(s.value) },
      })
    }

    return NextResponse.json(
      { message: "Settings updated" },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Admin access required" ? 403 : 401 }
      )
    }
    console.error("Admin settings PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

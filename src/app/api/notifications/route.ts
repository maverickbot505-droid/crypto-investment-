import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/auth"

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const notifications = await prisma.notification.findMany({
      where: { userId: sessionUser.id },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: limit,
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({ notifications, unreadCount }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Notifications GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    const { ids } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 })
    }

    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: sessionUser.id },
      data: { read: true },
    })

    return NextResponse.json({ message: "Notifications marked as read" }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Notifications PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    const { readAll } = await req.json()

    if (readAll) {
      await prisma.notification.updateMany({
        where: { userId: sessionUser.id, read: false },
        data: { read: true },
      })
      return NextResponse.json({ message: "All notifications marked as read" }, { status: 200 })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Notifications PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query parameter required" }, { status: 400 })
    }

    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ message: "Notification deleted" }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Notifications DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

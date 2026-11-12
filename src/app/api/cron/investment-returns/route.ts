import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/auth"
import { processInvestmentReturns } from "@/lib/investment-engine"

export async function POST() {
  try {
    await requireAdmin()
    const results = await processInvestmentReturns()
    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Admin access required" ? 403 : 401 })
    }
    console.error("Process returns error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

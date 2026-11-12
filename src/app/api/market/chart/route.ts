import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const coins: Record<string, { symbol: string; name: string; basePrice: number; coingeckoId: string }> = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", basePrice: 67500, coingeckoId: "bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum", basePrice: 3450, coingeckoId: "ethereum" },
  litecoin: { symbol: "LTC", name: "Litecoin", basePrice: 85, coingeckoId: "litecoin" },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const coin = searchParams.get("coin") || "bitcoin"
    const days = parseInt(searchParams.get("days") || "7", 10)

    const info = coins[coin]
    if (!info) {
      return NextResponse.json({ error: "Unsupported coin. Use: bitcoin, ethereum, litecoin" }, { status: 400 })
    }

    const setting = await prisma.siteSetting.findUnique({ where: { key: "market_data_source" } })
    const apiKeySetting = await prisma.siteSetting.findUnique({ where: { key: "coingecko_api_key" } })
    const useLive = setting?.value === "live" && apiKeySetting?.value

    if (useLive) {
      try {
        const vsCurrency = "usd"
        const url = `https://api.coingecko.com/api/v3/coins/${info.coingeckoId}/market_chart?vs_currency=${vsCurrency}&days=${Math.min(days, 90)}`
        const headers: Record<string, string> = {}
        if (apiKeySetting.value) {
          headers["x-cg-demo-api-key"] = apiKeySetting.value
        }
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
        if (response.ok) {
          const json = await response.json()
          const prices: [number, number][] = json.prices || []
          const data = prices.map(([timestamp, value]: [number, number]) => ({
            date: new Date(timestamp).toISOString(),
            value: Math.round(value * 100) / 100,
          }))
          return NextResponse.json({ symbol: info.symbol, name: info.name, data }, { status: 200 })
        }
      } catch {
        // fallback to mock on error
      }
    }

    const now = Date.now()
    const points = Math.min(days * 24, 168)
    const interval = (days * 24 * 60 * 60 * 1000) / points
    const data: { date: string; value: number }[] = []
    let price = info.basePrice

    for (let i = points; i >= 0; i--) {
      const timestamp = now - i * interval
      const change = (Math.random() - 0.48) * price * 0.02
      price = Math.max(price + change, info.basePrice * 0.5)
      data.push({
        date: new Date(timestamp).toISOString(),
        value: Math.round(price * 100) / 100,
      })
    }

    return NextResponse.json({ symbol: info.symbol, name: info.name, data }, { status: 200 })
  } catch (error) {
    console.error("Chart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

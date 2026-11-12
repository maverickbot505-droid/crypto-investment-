import { NextRequest, NextResponse } from "next/server"

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"

const forexMockData = [
  { symbol: "EUR/USD", price: 1.0850, change24h: 0.0012, changePercent24h: 0.11, type: "forex" },
  { symbol: "GBP/USD", price: 1.2680, change24h: -0.0035, changePercent24h: -0.28, type: "forex" },
  { symbol: "USD/JPY", price: 151.45, change24h: 0.85, changePercent24h: 0.56, type: "forex" },
  { symbol: "USD/CHF", price: 0.8820, change24h: -0.0010, changePercent24h: -0.11, type: "forex" },
  { symbol: "AUD/USD", price: 0.6570, change24h: 0.0023, changePercent24h: 0.35, type: "forex" },
  { symbol: "USD/CAD", price: 1.3620, change24h: 0.0018, changePercent24h: 0.13, type: "forex" },
  { symbol: "NZD/USD", price: 0.6120, change24h: -0.0015, changePercent24h: -0.24, type: "forex" },
  { symbol: "EUR/GBP", price: 0.8555, change24h: 0.0008, changePercent24h: 0.09, type: "forex" },
]

const cryptoIds = ["bitcoin", "ethereum", "binancecoin", "solana", "xrp"]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    if (type === "forex") {
      return NextResponse.json({ data: forexMockData }, { status: 200 })
    }

    try {
      const params = new URLSearchParams({
        ids: cryptoIds.join(","),
        vs_currencies: "usd",
        include_24hr_vol: "true",
        include_24hr_change: "true",
        include_last_updated_at: "true",
      })

      const response = await fetch(`${COINGECKO_URL}?${params}`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        throw new Error(`CoinGecko returned ${response.status}`)
      }

      const data = await response.json()

      const formatted = cryptoIds.map((id) => ({
        symbol: id === "binancecoin" ? "BNB" : id === "ethereum" ? "ETH" : id === "bitcoin" ? "BTC" : id === "solana" ? "SOL" : "XRP",
        name: id.charAt(0).toUpperCase() + id.slice(1),
        price: data[id]?.usd ?? 0,
        volume24h: data[id]?.usd_24h_vol ?? 0,
        change24h: data[id]?.usd_24h_change ?? 0,
        changePercent24h: data[id]?.usd_24h_change
          ? Number(((data[id].usd_24h_change / (data[id].usd - data[id].usd_24h_change)) * 100).toFixed(2))
          : 0,
        lastUpdated: data[id]?.last_updated_at ?? null,
        type: "crypto",
      }))

      return NextResponse.json({ data: formatted }, { status: 200 })
    } catch {
      const fallbackData = [
        { symbol: "BTC", name: "Bitcoin", price: 67500, change24h: 1200, changePercent24h: 1.81, type: "crypto" },
        { symbol: "ETH", name: "Ethereum", price: 3450, change24h: -45, changePercent24h: -1.29, type: "crypto" },
        { symbol: "BNB", name: "Binance Coin", price: 585, change24h: 12, changePercent24h: 2.09, type: "crypto" },
        { symbol: "SOL", name: "Solana", price: 145, change24h: 5.5, changePercent24h: 3.94, type: "crypto" },
        { symbol: "XRP", name: "XRP", price: 0.62, change24h: -0.01, changePercent24h: -1.59, type: "crypto" },
      ]

      return NextResponse.json({ data: fallbackData }, { status: 200 })
    }
  } catch (error) {
    console.error("Market error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

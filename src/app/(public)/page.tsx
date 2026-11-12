"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  TrendingUp, Shield, Clock, HeadphonesIcon, Wallet, BarChart3,
  ArrowRight, Zap, ChevronRight, Star, DollarSign, Users, Activity,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/utils"

type CryptoAsset = {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
}

type Plan = {
  id: string
  name: string
  description: string | null
  minAmount: number
  maxAmount: number
  duration: number
  dailyROI: number
  totalROI: number
  badge: string | null
}

const cryptoEmojis: Record<string, string> = {
  BTC: "₿",
  ETH: "⟠",
  BNB: "◎",
  SOL: "S",
  XRP: "✕",
}

const planColors: Record<string, { border: string; badge: string; gradient: string }> = {
  Starter: { border: "border-green-500/30", badge: "bg-green-500/10 text-green-400 border-green-500/30", gradient: "from-green-500/10 to-transparent" },
  Basic: { border: "border-blue-500/30", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30", gradient: "from-blue-500/10 to-transparent" },
  Silver: { border: "border-slate-400/30", badge: "bg-slate-400/10 text-slate-300 border-slate-400/30", gradient: "from-slate-400/10 to-transparent" },
  Gold: { border: "border-amber-500/30", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", gradient: "from-amber-500/10 to-transparent" },
  Platinum: { border: "border-purple-500/30", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30", gradient: "from-purple-500/10 to-transparent" },
  Elite: { border: "border-rose-500/30", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30", gradient: "from-rose-500/10 to-transparent" },
}

const features = [
  { icon: Shield, title: "Secure Platform", desc: "Bank-grade security with 256-bit encryption and multi-factor authentication." },
  { icon: TrendingUp, title: "High Returns", desc: "Competitive ROI with daily profit accumulation and flexible withdrawal." },
  { icon: Clock, title: "24/7 Trading", desc: "Round-the-clock market access with real-time monitoring and instant execution." },
  { icon: HeadphonesIcon, title: "Premium Support", desc: "Dedicated account managers and 24/7 customer support team." },
  { icon: Wallet, title: "Easy Deposits", desc: "Multiple payment methods including crypto, wire transfer, and e-wallets." },
  { icon: BarChart3, title: "Analytics", desc: "Advanced portfolio tracking with detailed performance analytics and reports." },
]

const stats = [
  { icon: DollarSign, value: "$2B+", label: "Total Traded" },
  { icon: Users, value: "50K+", label: "Active Users" },
  { icon: Activity, value: "99.9%", label: "Uptime" },
  { icon: Star, value: "4.9/5", label: "User Rating" },
]

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(0)},${(h - ((v - min) / range) * h).toFixed(0)}`).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

function TickerTape({ assets }: { assets: CryptoAsset[] }) {
  if (!assets.length) return null
  const items = [...assets, ...assets, ...assets]
  return (
    <div className="relative overflow-hidden bg-primary/5 border-y border-border/40 py-2">
      <div className="flex whitespace-nowrap animate-scroll gap-8">
        {items.map((a, i) => (
          <div key={`${a.symbol}-${i}`} className="flex items-center gap-2 text-sm shrink-0">
            <span className="font-semibold text-foreground">{a.symbol}</span>
            <span className="text-muted-foreground">{a.price >= 1 ? formatCurrency(a.price) : `$${a.price}`}</span>
            <span className={a.changePercent24h >= 0 ? "text-green-500" : "text-red-500"}>
              {a.changePercent24h >= 0 ? "+" : ""}{a.changePercent24h?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function fadeUpVariant(dir: "up" | "left" | "right" = "up") {
  return {
    hidden: { opacity: 0, y: dir === "up" ? 40 : 0, x: dir === "left" ? -40 : dir === "right" ? 40 : 0 },
    visible: (i = 0) => ({
      opacity: 1, y: 0, x: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  }
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </motion.div>
  )
}

export default function LandingPage() {
  const [assets, setAssets] = useState<CryptoAsset[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [marketRes, plansRes] = await Promise.all([
          api.get<{ data: CryptoAsset[] }>("/api/market?type=crypto"),
          api.get<{ plans: Plan[] }>("/api/investments/plans"),
        ])
        if (marketRes.data?.data) setAssets(marketRes.data.data)
        if (plansRes.data?.plans) setPlans(plansRes.data.plans)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const generateSparklineData = useCallback(() => {
    const len = 20
    const base = Math.random() * 50000 + 100
    return Array.from({ length: len }, (_, i) => base + Math.sin(i * 0.5) * base * 0.05 + (Math.random() - 0.5) * base * 0.02)
  }, [])

  return (
    <div className="overflow-hidden">
      {!loading && !error && assets.length > 0 && <TickerTape assets={assets} />}

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-yellow-500" />
              Trusted by 50,000+ investors worldwide
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight"
          >
            Invest in Your Future with{" "}
            <span className="text-gradient">InvestPro</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Smart, secure, and profitable investment opportunities tailored for you.
            Start building your wealth today with cutting-edge AI-driven strategies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/pricing">
                View Plans
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold font-display text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="Market Overview" subtitle="Real-time cryptocurrency prices and trends" />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : error || !assets.length ? (
            <p className="text-center text-muted-foreground">Market data temporarily unavailable.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {assets.map((asset, i) => {
                const color = asset.changePercent24h >= 0 ? "#22c55e" : "#ef4444"
                return (
                  <motion.div
                    key={asset.symbol}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpVariant("up")}
                  >
                    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cryptoEmojis[asset.symbol] || "₿"}</span>
                            <div>
                              <p className="font-semibold text-sm">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <Sparkline data={generateSparklineData()} color={color} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {asset.price >= 1 ? formatCurrency(asset.price) : `$${asset.price}`}
                          </span>
                          <Badge variant={asset.changePercent24h >= 0 ? "success" : "destructive"} className="text-xs">
                            {asset.changePercent24h >= 0 ? "+" : ""}{asset.changePercent24h?.toFixed(2)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Investment Plans */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="Investment Plans" subtitle="Choose the plan that fits your investment goals" />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : error || !plans.length ? (
            <p className="text-center text-muted-foreground">No investment plans available at this time.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, i) => {
                const colors = planColors[plan.name] || planColors.Platinum
                return (
                  <motion.div
                    key={plan.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={fadeUpVariant("up")}
                    className="group relative"
                  >
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-b ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <Card className={`relative bg-card/80 border ${colors.border} backdrop-blur-sm hover:shadow-lg hover:shadow-${colors.border.replace("border-", "").replace("/30", "/10")} transition-all duration-300`}>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-display font-bold">{plan.name}</h3>
                          {plan.badge && (
                            <Badge className={colors.badge} variant="outline">{plan.badge}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                          {plan.description || `${plan.name} investment plan`}
                        </p>
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Min Deposit</span>
                            <span className="font-semibold">{formatCurrency(plan.minAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Max Deposit</span>
                            <span className="font-semibold">{formatCurrency(plan.maxAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-semibold">{plan.duration} days</span>
                          </div>
                          <div className="border-t border-border/40 pt-3 flex justify-between">
                            <span className="text-sm text-muted-foreground">Daily ROI</span>
                            <span className="font-semibold text-green-500">{plan.dailyROI}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total ROI</span>
                            <span className="font-semibold text-primary">{plan.totalROI}%</span>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <Button asChild className="w-full group">
                            <Link href="/register">
                              Invest Now
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionTitle title="Why Choose InvestPro" subtitle="We provide the tools and security you need to invest with confidence" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUpVariant("up")}
              >
                <Card className="bg-card/50 border-border/50 h-full hover:border-primary/30 transition-colors group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient">
            Ready to Start Investing?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Join thousands of smart investors growing their wealth with InvestPro.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild>
              <Link href="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/pricing">Compare Plans</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

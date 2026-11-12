"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, ChevronRight, Calculator, TrendingUp, DollarSign, Clock, Percent } from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatNumber } from "@/lib/utils"

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

const planColors: Record<string, { border: string; badge: string; gradient: string; shadow: string }> = {
  Starter: { border: "border-green-500/30", badge: "bg-green-500/10 text-green-400 border-green-500/30", gradient: "from-green-500/5", shadow: "shadow-green-500/5" },
  Basic: { border: "border-blue-500/30", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30", gradient: "from-blue-500/5", shadow: "shadow-blue-500/5" },
  Silver: { border: "border-slate-400/30", badge: "bg-slate-400/10 text-slate-300 border-slate-400/30", gradient: "from-slate-400/5", shadow: "shadow-slate-400/5" },
  Gold: { border: "border-amber-500/30", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", gradient: "from-amber-500/5", shadow: "shadow-amber-500/5" },
  Platinum: { border: "border-purple-500/30", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30", gradient: "from-purple-500/5", shadow: "shadow-purple-500/5" },
  Elite: { border: "border-rose-500/30", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30", gradient: "from-rose-500/5", shadow: "shadow-rose-500/5" },
}

function fadeUpVariant() {
  return {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
    }),
  }
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [investment, setInvestment] = useState("1000")

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await api.get<{ plans: Plan[] }>("/api/investments/plans")
        if (res.data?.plans) setPlans(res.data.plans)
        else setError(true)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const investAmount = useMemo(() => {
    const num = parseFloat(investment)
    return isNaN(num) || num < 0 ? 0 : num
  }, [investment])

  const calculatedPlans = useMemo(() => {
    return plans.map((plan) => {
      const dailyEarning = investAmount * (plan.dailyROI / 100)
      const totalEarning = investAmount * (plan.totalROI / 100)
      const finalBalance = investAmount + totalEarning
      return { ...plan, dailyEarning, totalEarning, finalBalance }
    })
  }, [plans, investAmount])

  return (
    <div className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            Investment Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">
            Choose Your Investment Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select a plan that matches your financial goals. Use our calculator to estimate your returns.
          </p>
        </motion.div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <Card className="bg-card/50 border-border/50 max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">ROI Calculator</CardTitle>
              </div>
              <CardDescription>Enter an amount to see projected earnings for each plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="calc-amount">Investment Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="calc-amount"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="1000"
                    value={investment}
                    onChange={(e) => setInvestment(e.target.value)}
                    className="pl-10 text-lg font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Unable to load investment plans. Please try again later.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && plans.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No investment plans available at this time.</p>
          </div>
        )}

        {/* Plans Grid */}
        {!loading && !error && plans.length > 0 && (
          <>
            {investAmount > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {calculatedPlans.map((plan, i) => {
                  const colors = planColors[plan.name] || planColors.Platinum
                  return (
                    <motion.div
                      key={plan.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUpVariant()}
                    >
                      <Card className={`bg-card/50 border ${colors.border} bg-gradient-to-b ${colors.gradient} to-transparent h-full`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-display font-semibold">{plan.name}</h3>
                            {plan.badge && <Badge className={colors.badge} variant="outline">{plan.badge}</Badge>}
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Daily Earnings</span>
                              <span className="font-semibold text-green-500">{formatCurrency(plan.dailyEarning)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Return</span>
                              <span className="font-semibold text-primary">{formatCurrency(plan.totalEarning)}</span>
                            </div>
                            <Separator className="bg-border/40" />
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Final Balance</span>
                              <span className="font-bold text-lg">{formatCurrency(plan.finalBalance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Duration</span>
                              <span className="font-medium">{plan.duration} days</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, i) => {
                const colors = planColors[plan.name] || planColors.Platinum
                return (
                  <motion.div
                    key={plan.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariant()}
                    className="group relative"
                  >
                    <div className={`absolute -inset-[1px] rounded-xl bg-gradient-to-b from-transparent via-transparent to-${colors.border.replace("border-", "").replace("/30", "/20")} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                    <Card className={`relative bg-card border ${colors.border} backdrop-blur-sm hover:shadow-xl ${colors.shadow} transition-all duration-300 h-full flex flex-col`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                          {plan.badge && <Badge className={colors.badge} variant="outline">{plan.badge}</Badge>}
                        </div>
                        {plan.description && (
                          <CardDescription className="text-sm">{plan.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Min-Max Deposit</p>
                              <p className="font-semibold">{formatCurrency(plan.minAmount)} - {formatCurrency(plan.maxAmount)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-semibold">{plan.duration} days</p>
                            </div>
                          </div>
                          <Separator className="bg-border/40" />
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-green-500" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Daily ROI</p>
                              <p className="font-semibold text-green-500">{formatNumber(plan.dailyROI)}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Total ROI</p>
                              <p className="font-semibold text-primary">{formatNumber(plan.totalROI)}%</p>
                            </div>
                          </div>

                          {investAmount > 0 && (
                            <>
                              <Separator className="bg-border/40" />
                              <div className="rounded-lg bg-primary/5 p-3 space-y-1.5">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Daily earning</span>
                                  <span className="font-medium text-green-500">{formatCurrency(investAmount * (plan.dailyROI / 100))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total profit</span>
                                  <span className="font-medium text-primary">{formatCurrency(investAmount * (plan.totalROI / 100))}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full group">
                          <Link href="/register">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        {!loading && plans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <h2 className="text-2xl font-display font-bold mb-2">Not sure which plan to choose?</h2>
            <p className="text-muted-foreground mb-6">Contact our support team for personalized advice.</p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

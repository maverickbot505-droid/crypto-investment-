"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import {
  TrendingUp,
  Clock,
  Award,
  Users,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Shield,
  Ban,
  DollarSign,
  Wallet,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import type { InvestmentPlanType, UserType } from "@/types"

const investFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
})

type InvestFormInput = z.infer<typeof investFormSchema>

const planColors: Record<string, { border: string; badge: string; gradient: string; accent: string }> = {
  Starter: {
    border: "border-green-500/30",
    badge: "bg-green-500/10 text-green-400 border-green-500/30",
    gradient: "from-green-500/10",
    accent: "text-green-500",
  },
  Basic: {
    border: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    gradient: "from-blue-500/10",
    accent: "text-blue-500",
  },
  Silver: {
    border: "border-slate-400/30",
    badge: "bg-slate-400/10 text-slate-300 border-slate-400/30",
    gradient: "from-slate-400/10",
    accent: "text-slate-400",
  },
  Gold: {
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    gradient: "from-amber-500/10",
    accent: "text-amber-500",
  },
  Platinum: {
    border: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    gradient: "from-purple-500/10",
    accent: "text-purple-500",
  },
  Elite: {
    border: "border-rose-500/30",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    gradient: "from-rose-500/10",
    accent: "text-rose-500",
  },
}

const defaultColor = {
  border: "border-primary/30",
  badge: "bg-primary/10 text-primary border-primary/30",
  gradient: "from-primary/10",
  accent: "text-primary",
}

export default function InvestPage() {
  const [plans, setPlans] = useState<InvestmentPlanType[]>([])
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlanType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvestFormInput>({
    resolver: zodResolver(investFormSchema),
  })

  const amount = Number(watch("amount")) || 0

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [plansRes, userRes] = await Promise.all([
        api.get<{ plans: InvestmentPlanType[] }>("/api/investments/plans"),
        api.get<{ user: UserType }>("/api/users"),
      ])
      if (plansRes.error) throw new Error(plansRes.error)
      if (userRes.error) throw new Error(userRes.error)
      setPlans(plansRes.data!.plans)
      setUser(userRes.data!.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investment plans")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  function openInvestDialog(plan: InvestmentPlanType) {
    setSelectedPlan(plan)
    reset({ amount: String(plan.minAmount) })
    setDialogOpen(true)
  }

  async function onSubmit(data: InvestFormInput) {
    if (!selectedPlan || !user) return
    const amt = Number(data.amount)
    if (amt < selectedPlan.minAmount) {
      toast({
        title: "Amount too low",
        description: `Minimum investment is ${formatCurrency(selectedPlan.minAmount)}`,
        variant: "destructive",
      })
      return
    }
    if (selectedPlan.maxAmount && amt > selectedPlan.maxAmount) {
      toast({
        title: "Amount too high",
        description: `Maximum investment is ${formatCurrency(selectedPlan.maxAmount)}`,
        variant: "destructive",
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post("/api/investments", {
        planId: selectedPlan.id,
        amount: amt,
        paymentMethodId: "balance",
      })
      if (res.error) {
        toast({ title: "Investment failed", description: res.error, variant: "destructive" })
        return
      }
      toast({ title: "Investment created!", description: "Your investment is now active." })
      setDialogOpen(false)
      setSelectedPlan(null)
      fetchData()
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const projectedReturn = selectedPlan ? amount * (1 + Number(selectedPlan.roiPercent) / 100) : 0
  const dailyEarning = selectedPlan
    ? Number(selectedPlan.dailyRoiPercent)
      ? (amount * Number(selectedPlan.dailyRoiPercent)) / 100
      : (projectedReturn - amount) / selectedPlan.durationDays
    : 0

  if (loading) return <InvestSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive/60 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load plans</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Investment Plans</h1>
        <p className="text-sm text-muted-foreground">
          Choose a plan that fits your investment goals
        </p>
      </div>

      {user && user.kycStatus !== "APPROVED" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm flex-1">
              KYC verification required to invest.{" "}
              <a href="/kyc" className="text-primary hover:underline font-medium">
                Complete KYC
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No plans available</h2>
          <p className="text-sm text-muted-foreground">Check back later for new investment opportunities.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const colors = planColors[plan.name] ?? defaultColor
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group relative"
              >
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-b ${colors.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <Card
                  className={`relative bg-card/80 border ${colors.border} backdrop-blur-sm h-full transition-all duration-300 hover:shadow-lg`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-display font-bold">{plan.name}</h3>
                      {plan.badge && (
                        <Badge className={colors.badge} variant="outline">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                      {plan.description ?? `${plan.name} investment plan`}
                    </p>

                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min</span>
                        <span className="font-semibold">{formatCurrency(plan.minAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max</span>
                        <span className="font-semibold">
                          {plan.maxAmount ? formatCurrency(plan.maxAmount) : "Unlimited"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-semibold">{plan.durationDays} days</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ROI</span>
                        <span className={`font-semibold ${colors.accent}`}>
                          {Number(plan.roiPercent)}%
                        </span>
                      </div>
                      {plan.dailyRoiPercent && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Daily ROI</span>
                          <span className="font-semibold text-green-500">
                            {Number(plan.dailyRoiPercent)}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Referral Bonus</span>
                        <span className="font-semibold">{plan.referralBonus}%</span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-6"
                      disabled={user?.kycStatus !== "APPROVED"}
                      title={
                        user?.kycStatus !== "APPROVED" ? "KYC verification required" : undefined
                      }
                      onClick={() => openInvestDialog(plan)}
                    >
                      {user?.kycStatus !== "APPROVED" ? (
                        <>
                          <Ban className="mr-2 h-4 w-4" />
                          KYC Required
                        </>
                      ) : (
                        <>
                          Invest Now
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to invest
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  placeholder="0.00"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
              {selectedPlan && amount > 0 && (
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Min: {formatCurrency(selectedPlan.minAmount)}</span>
                  {selectedPlan.maxAmount && (
                    <>
                      <span>|</span>
                      <span>Max: {formatCurrency(selectedPlan.maxAmount)}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {amount > 0 && selectedPlan && (() => {
              const valid =
                amount >= selectedPlan.minAmount &&
                (!selectedPlan.maxAmount || amount <= selectedPlan.maxAmount)
              if (!valid) return null
              return (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium">Projected Earnings</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected Return</span>
                    <span className="font-semibold text-green-500">
                      {formatCurrency(projectedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Earnings</span>
                    <span className="font-semibold">
                      {formatCurrency(dailyEarning)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit</span>
                    <span className="font-semibold text-green-500">
                      {formatCurrency(projectedReturn - amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold">{selectedPlan.durationDays} days</span>
                  </div>
                </div>
              )
            })()}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Investing...
                  </>
                ) : (
                  "Confirm Investment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function InvestSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

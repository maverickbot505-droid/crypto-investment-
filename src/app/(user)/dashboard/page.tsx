"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Wallet,
  TrendingUp,
  DollarSign,
  ArrowUpFromLine,
  ArrowDownToLine,
  Bell,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PiggyBank,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  formatCurrency,
  calculateDaysRemaining,
  calculateProgress,
  timeAgo,
  getInitials,
} from "@/lib/utils"
import type { UserType, InvestmentType, NotificationType, TransactionType } from "@/types"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

type ChartCoin = { symbol: string; name: string; data: { date: string; value: number }[] }

type DashboardData = {
  user: UserType | null
  investments: InvestmentType[]
  notifications: NotificationType[]
  pendingWithdrawals: TransactionType[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    user: null,
    investments: [],
    notifications: [],
    pendingWithdrawals: [],
  })
  const [charts, setCharts] = useState<ChartCoin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [userRes, investmentsRes, notificationsRes, withdrawalsRes] = await Promise.all([
        api.get<{ user: UserType }>("/api/users"),
        api.get<{ investments: InvestmentType[] }>("/api/investments"),
        api.get<{ notifications: NotificationType[] }>("/api/notifications"),
        api.get<{ withdrawals: TransactionType[] }>("/api/withdrawals"),
      ])

      if (userRes.error) throw new Error(userRes.error)
      if (investmentsRes.error) throw new Error(investmentsRes.error)
      if (notificationsRes.error) throw new Error(notificationsRes.error)
      if (withdrawalsRes.error) throw new Error(withdrawalsRes.error)

      setData({
        user: userRes.data!.user,
        investments: investmentsRes.data!.investments,
        notifications: notificationsRes.data!.notifications,
        pendingWithdrawals: withdrawalsRes.data!.withdrawals.filter(
          (w) => w.status === "PENDING"
        ),
      })

      const [btc, eth, ltc] = await Promise.all([
        api.get<ChartCoin>("/api/market/chart?coin=bitcoin&days=3"),
        api.get<ChartCoin>("/api/market/chart?coin=ethereum&days=3"),
        api.get<ChartCoin>("/api/market/chart?coin=litecoin&days=3"),
      ])
      setCharts([btc.data, eth.data, ltc.data].filter(Boolean) as ChartCoin[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statsCards: Array<{
    title: string
    value: number
    icon: typeof Wallet
    color: string
    bg: string
    pendingCount?: number
  }> = [
    {
      title: "Total Invested",
      value: data.user?.totalInvested ?? 0,
      icon: BarChart3,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Earnings",
      value: data.user?.totalEarned ?? 0,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Available Balance",
      value: data.user?.balance ?? 0,
      icon: Wallet,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Pending Withdrawals",
      value: data.pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      icon: ArrowUpFromLine,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      pendingCount: data.pendingWithdrawals.length,
    },
  ]

  const activeInvestments = data.investments.filter((inv) => inv.status === "ACTIVE")
  const recentTransactions = [
    ...data.investments.map((inv) => ({
      id: inv.id,
      type: "INVESTMENT" as const,
      amount: inv.amount,
      status: inv.status,
      createdAt: inv.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={fetchData}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {data.user?.firstName ?? "Investor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your investment overview
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg ${stat.bg} p-2.5`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {(stat.pendingCount ?? 0) > 0 && (
                    <Badge variant="warning">{stat.pendingCount}</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{formatCurrency(stat.value)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!loading && charts.length > 0 && (
        <Card className="border-muted">
          <CardHeader><CardTitle className="text-lg">Market Prices</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {charts.map((coin) => {
                const latest = coin.data[coin.data.length - 1]
                const first = coin.data[0]
                const change = latest ? ((latest.value - first.value) / first.value * 100).toFixed(2) : "0"
                const color = Number(change) >= 0 ? "#22c55e" : "#ef4444"
                return (
                  <div key={coin.symbol} className="rounded-lg border border-muted p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{coin.symbol}</p>
                        <p className="text-xs text-muted-foreground">{coin.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono">${latest?.value.toLocaleString() ?? "-"}</p>
                        <p className="text-xs font-mono" style={{ color }}>{Number(change) >= 0 ? "+" : ""}{change}%</p>
                      </div>
                    </div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={coin.data}>
                          <defs>
                            <linearGradient id={`grad-${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" hide />
                          <YAxis domain={["auto", "auto"]} hide />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                            labelFormatter={(l) => new Date(l).toLocaleDateString()}
                            formatter={(v: number) => [`$${v.toLocaleString()}`, coin.symbol]}
                          />
                          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${coin.symbol})`} strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Active Investments</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/invest">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeInvestments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <PiggyBank className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No active investments</p>
                  <Button size="sm" asChild>
                    <Link href="/invest">Start Investing</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeInvestments.slice(0, 5).map((inv) => {
                    const progress = calculateProgress(inv.startDate, inv.endDate)
                    const daysRemaining = calculateDaysRemaining(inv.endDate)
                    return (
                      <div
                        key={inv.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">{inv.plan?.name ?? "Investment"}</p>
                            <p className="text-xs text-muted-foreground">
                              {daysRemaining > 0
                                ? `${daysRemaining} days remaining`
                                : "Completed"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(inv.amount)}</p>
                            <p className="text-xs text-green-500">
                              +{formatCurrency(inv.earnings)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progress.toFixed(0)}% complete</span>
                            <span>Expected: {formatCurrency(inv.expectedReturn)}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.slice(0, 10).map((tx) => (
                        <tr key={tx.id} className="border-b last:border-0">
                          <td className="py-3">
                            <Badge
                              variant={
                                tx.type === "INVESTMENT"
                                  ? "default"
                                  : tx.type === "DEPOSIT"
                                    ? "success"
                                    : "warning"
                              }
                              className="capitalize"
                            >
                              {tx.type.toLowerCase().replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={tx.status} />
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {timeAgo(tx.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/invest">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Invest Now
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="secondary" asChild>
                <Link href="/deposit">
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Deposit
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/withdraw">
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Withdraw
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {data.notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        !n.read ? "border-primary/20 bg-primary/5" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(n.title)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
    ACTIVE: "success",
    COMPLETED: "success",
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "destructive",
    CANCELLED: "destructive",
  }
  return (
    <Badge variant={variants[status] ?? "outline"} className="capitalize">
      {status.toLowerCase()}
    </Badge>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle className="h-16 w-16 text-destructive/60 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-24 mt-4" />
              <Skeleton className="h-8 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

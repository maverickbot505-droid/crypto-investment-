"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileText,
  Clock,
  Banknote,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api/client"
import { formatCurrency, timeAgo } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface AdminStats {
  totalUsers: number
  totalInvested: number
  totalWithdrawn: number
  totalEarnings: number
  pendingKyc: number
  pendingDeposits: number
  pendingWithdrawals: number
}

interface AuditLog {
  id: string
  adminName: string
  action: string
  target: string
  timestamp: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    const [statsRes, logsRes] = await Promise.all([
      api.get<AdminStats>("/api/admin/stats"),
      api.get<{ logs: AuditLog[] }>("/api/admin/audit-logs?limit=10"),
    ])

    if (statsRes.error) {
      setError(statsRes.error)
      toast({ title: "Error", description: statsRes.error, variant: "destructive" })
    } else {
      setStats((statsRes.data as unknown as { stats: AdminStats })?.stats ?? null)
    }

    if (logsRes.error) {
      toast({ title: "Error", description: "Failed to load audit logs", variant: "destructive" })
    } else {
      setLogs((logsRes.data as unknown as { recentAuditLogs: AuditLog[] })?.recentAuditLogs ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "from-blue-500/20 to-blue-600/10", iconColor: "text-blue-400", prefix: "" },
    { label: "Total Invested", value: stats?.totalInvested ?? 0, icon: TrendingUp, color: "from-emerald-500/20 to-emerald-600/10", iconColor: "text-emerald-400", prefix: "$" },
    { label: "Total Withdrawn", value: stats?.totalWithdrawn ?? 0, icon: ArrowUpRight, color: "from-orange-500/20 to-orange-600/10", iconColor: "text-orange-400", prefix: "$" },
    { label: "Total Earnings", value: stats?.totalEarnings ?? 0, icon: DollarSign, color: "from-purple-500/20 to-purple-600/10", iconColor: "text-purple-400", prefix: "$" },
    { label: "Pending KYC", value: stats?.pendingKyc ?? 0, icon: ShieldCheck, color: "from-yellow-500/20 to-yellow-600/10", iconColor: "text-yellow-400", prefix: "" },
    { label: "Pending Deposits", value: stats?.pendingDeposits ?? 0, icon: Banknote, color: "from-cyan-500/20 to-cyan-600/10", iconColor: "text-cyan-400", prefix: "" },
    { label: "Pending Withdrawals", value: stats?.pendingWithdrawals ?? 0, icon: Clock, color: "from-rose-500/20 to-rose-600/10", iconColor: "text-rose-400", prefix: "" },
  ]

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your platform</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden border-muted">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color}`} />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold tracking-tight">
                        {stat.prefix === "$" ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className={`rounded-full bg-background/50 p-3 ${stat.iconColor}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.adminName}</span>
                        <span className="text-muted-foreground"> {log.action} </span>
                        <span className="font-medium">{log.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(log.timestamp)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Review Pending KYC", href: "/admin/kyc", count: stats?.pendingKyc, icon: ShieldCheck },
              { label: "Approve Deposits", href: "/admin/deposits", count: stats?.pendingDeposits, icon: Banknote },
              { label: "Process Withdrawals", href: "/admin/withdrawals", count: stats?.pendingWithdrawals, icon: Clock },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-lg border border-muted p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {action.count && action.count > 0 ? (
                    <Badge variant="warning">{action.count}</Badge>
                  ) : null}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </a>
            ))}
            <Separator className="my-2" />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                const res = await api.post("/api/cron/investment-returns")
                if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
                else { toast({ title: "Returns Processed", description: `Processed ${(res.data as any)?.processed || 0} investments, ${(res.data as any)?.completed || 0} completed` }) }
                fetchData()
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Process Investment Returns
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

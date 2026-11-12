"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { formatCurrency, timeAgo } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface WithdrawalItem {
  id: string
  userId: string
  amount: number
  status: string
  method: string
  accountDetails: string
  note: string
  createdAt: string
  user: { id: string; email: string; firstName: string; lastName: string; balance: number }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("")
  const [note, setNote] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchWithdrawals = async (status?: string) => {
    setLoading(true)
    const params = status ? `?status=${status}` : ""
    const res = await api.get<{ withdrawals: WithdrawalItem[] }>(`/api/admin/withdrawals${params}`)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { setWithdrawals(res.data?.withdrawals ?? []) }
    setLoading(false)
  }

  useEffect(() => { fetchWithdrawals() }, [])

  const handleAction = async (id: string, status: string) => {
    setProcessing(id)
    const res = await api.patch(`/api/admin/withdrawals/${id}`, { status, note })
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Success", description: `Withdrawal ${status}` }); setNote("") }
    setProcessing(null)
    fetchWithdrawals(filter || undefined)
  }

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { PENDING: "warning", APPROVED: "success", REJECTED: "destructive", CANCELLED: "default" }
    return <Badge variant={(m[s] || "default") as any}>{s}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Withdrawals</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/admin/export?type=withdrawals${filter ? `&status=${filter}` : ""}`, "_blank")}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => { setFilter(s); fetchWithdrawals(s) }}>
              {s || "All"}
            </Button>
          ))}
        </div>
      </div>
      <Card className="border-muted">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-muted">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No withdrawals</td></tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-muted transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{w.user.firstName} {w.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{w.user.email}</p>
                        <p className="text-xs text-muted-foreground">Bal: {formatCurrency(Number(w.user.balance))}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(w.amount))}</td>
                      <td className="px-4 py-3">{w.method || "-"}</td>
                      <td className="px-4 py-3">{statusBadge(w.status)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(w.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {w.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="text-emerald-500" onClick={() => handleAction(w.id, "APPROVED")} disabled={processing === w.id}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAction(w.id, "REJECTED")} disabled={processing === w.id}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

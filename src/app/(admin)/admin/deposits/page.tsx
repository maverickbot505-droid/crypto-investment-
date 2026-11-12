"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, ExternalLink, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { formatCurrency, timeAgo } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface DepositItem {
  id: string
  userId: string
  amount: number
  status: string
  method: string
  proofUrl: string
  note: string
  createdAt: string
  user: { id: string; email: string; firstName: string; lastName: string }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("")
  const [note, setNote] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDeposits = async (status?: string) => {
    setLoading(true)
    const params = status ? `?status=${status}` : ""
    const res = await api.get<{ deposits: DepositItem[] }>(`/api/admin/deposits${params}`)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { setDeposits(res.data?.deposits ?? []) }
    setLoading(false)
  }

  useEffect(() => { fetchDeposits() }, [])

  const handleAction = async (id: string, status: string) => {
    setProcessing(id)
    const res = await api.patch(`/api/admin/deposits/${id}`, { status, note })
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Success", description: `Deposit ${status}` }); setNote("") }
    setProcessing(null)
    fetchDeposits(filter || undefined)
  }

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { PENDING: "warning", APPROVED: "success", REJECTED: "destructive", CANCELLED: "default" }
    return <Badge variant={(m[s] || "default") as any}>{s}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deposits</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/admin/export?type=deposits${filter ? `&status=${filter}` : ""}`, "_blank")}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => { setFilter(s); fetchDeposits(s) }}>
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
                ) : deposits.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No deposits</td></tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="border-b border-muted transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.user.firstName} {d.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{d.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(d.amount))}</td>
                      <td className="px-4 py-3">{d.method || "-"}</td>
                      <td className="px-4 py-3">{statusBadge(d.status)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(d.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {d.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="text-emerald-500" onClick={() => handleAction(d.id, "APPROVED")} disabled={processing === d.id}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAction(d.id, "REJECTED")} disabled={processing === d.id}>
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

"use client"
import { useState, useEffect } from "react"
import {
  Search, Shield, ShieldOff, Ban, Edit3, X, Check, Plus, Trash2, DollarSign, CreditCard, Wallet
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { formatCurrency, timeAgo } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface UserItem {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  kycStatus: string
  balance: number
  totalInvested: number
  totalEarned: number
  isSuspended: boolean
  createdAt: string
  _count: { investments: number; transactions: number }
}

interface TransactionItem {
  id: string
  userId: string
  type: string
  amount: number
  status: string
  method: string
  note: string
  createdAt: string
  user: { id: string; email: string; firstName: string; lastName: string }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", balance: 0 })
  const [txUser, setTxUser] = useState<UserItem | null>(null)
  const [txForm, setTxForm] = useState({ type: "ADMIN_CREDIT", amount: "", status: "APPROVED", note: "" })
  const [txLoading, setTxLoading] = useState(false)
  const { toast } = useToast()

  const fetchUsers = async (q?: string) => {
    setLoading(true)
    const params = q ? `?search=${encodeURIComponent(q)}` : ""
    const res = await api.get<{ users: UserItem[] }>(`/api/admin/users${params}`)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { setUsers(res.data?.users ?? []) }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(search) }

  const toggleSuspend = async (user: UserItem) => {
    const res = await api.patch(`/api/admin/users/${user.id}`, { isSuspended: !user.isSuspended })
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Success", description: `User ${user.isSuspended ? "unsuspended" : "suspended"}` }); fetchUsers(search || undefined) }
  }

  const openEdit = (user: UserItem) => {
    setEditingUser(user)
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, balance: Number(user.balance) })
  }

  const saveEdit = async () => {
    if (!editingUser) return
    const res = await api.patch(`/api/admin/users/${editingUser.id}`, editForm)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Updated" }); setEditingUser(null); fetchUsers(search || undefined) }
  }

  const createTransaction = async () => {
    if (!txUser) return
    setTxLoading(true)
    const res = await api.post("/api/admin/transactions", {
      userId: txUser.id,
      type: txForm.type,
      amount: parseFloat(txForm.amount),
      status: txForm.status,
      note: txForm.note,
    })
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Transaction created" }); setTxUser(null); setTxForm({ type: "ADMIN_CREDIT", amount: "", status: "APPROVED", note: "" }); fetchUsers(search || undefined) }
    setTxLoading(false)
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = { USER: "default", ADMIN: "warning", SUPER_ADMIN: "destructive" }
    return <Badge variant={(colors[role] || "default") as any}>{role}</Badge>
  }

  const kycBadge = (status: string) => {
    const colors: Record<string, string> = { APPROVED: "success", PENDING: "warning", REJECTED: "destructive", NOT_SUBMITTED: "default" }
    return <Badge variant={(colors[status] || "default") as any}>{status.replace("_", " ")}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit">Search</Button>
      </form>
      <Card className="border-muted">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">KYC</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Invested</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-muted">
                      <td className="px-4 py-3"><Skeleton className="h-5 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 mx-auto" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-32 ml-auto" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr> : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-muted transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {editingUser?.id === user.id ? (
                          <div className="flex flex-col gap-1 min-w-[200px]">
                            <div className="flex gap-1">
                              <Input size={1} value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="h-7 text-xs" placeholder="First" />
                              <Input size={1} value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="h-7 text-xs" placeholder="Last" />
                            </div>
                            <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="h-7 text-xs" placeholder="Email" />
                            <Input type="number" value={editForm.balance} onChange={e => setEditForm({ ...editForm, balance: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" placeholder="Balance" />
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6 text-emerald-500" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-6 text-destructive" onClick={() => setEditingUser(null)}><X className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{roleBadge(user.role)}</td>
                      <td className="px-4 py-3">{kycBadge(user.kycStatus)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(user.balance))}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(user.totalInvested))}</td>
                      <td className="px-4 py-3 text-center">
                        {user.isSuspended ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)} title="Edit"><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSuspend(user)} title={user.isSuspended ? "Unsuspend" : "Suspend"}>
                            {user.isSuspended ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                          <Dialog open={txUser?.id === user.id} onOpenChange={(open) => { if (!open) setTxUser(null) }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTxUser(user); setTxForm({ type: "ADMIN_CREDIT", amount: "", status: "APPROVED", note: "" }) }} title="Transaction">
                                <Wallet className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Create Transaction for {user.firstName} {user.lastName}</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs text-muted-foreground">Type</label>
                                  <Select value={txForm.type} onValueChange={v => setTxForm({ ...txForm, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ADMIN_CREDIT">Credit (Add Funds)</SelectItem>
                                      <SelectItem value="ADMIN_DEBIT">Debit (Remove Funds)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Amount ($)</label>
                                  <Input type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Status</label>
                                  <Select value={txForm.status} onValueChange={v => setTxForm({ ...txForm, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="APPROVED">Approved</SelectItem>
                                      <SelectItem value="PENDING">Pending</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Note</label>
                                  <Textarea value={txForm.note} onChange={e => setTxForm({ ...txForm, note: e.target.value })} rows={2} />
                                </div>
                                <Button onClick={createTransaction} disabled={txLoading || !txForm.amount} className="w-full">
                                  <Plus className="mr-2 h-4 w-4" /> Create Transaction
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
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

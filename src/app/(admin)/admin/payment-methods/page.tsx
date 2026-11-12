"use client"
import { useState, useEffect } from "react"
import { Plus, Edit3, Trash2, Check, X, Wallet, Landmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"

interface PaymentMethod {
  id: string
  type: string
  label: string
  isActive: boolean
  instructions: string
  walletAddress: string
  bankDetails: string
  sortOrder: number
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const fetchMethods = async () => {
    setLoading(true)
    const res = await api.get<{ paymentMethods: PaymentMethod[] }>("/api/admin/payment-methods")
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { setMethods(res.data?.paymentMethods ?? []) }
    setLoading(false)
  }

  useEffect(() => { fetchMethods() }, [])

  const saveMethod = async (data: Partial<PaymentMethod>, id?: string) => {
    let res: any
    if (id) {
      res = await api.put(`/api/admin/payment-methods/${id}`, data)
    } else {
      res = await api.post("/api/admin/payment-methods", data)
    }
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
    toast({ title: id ? "Updated" : "Created" })
    setEditing(null); setCreating(false); fetchMethods()
  }

  const deleteMethod = async (id: string) => {
    const res = await api.delete(`/api/admin/payment-methods/${id}`)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
    toast({ title: "Deleted" })
    fetchMethods()
  }

  const MethodForm = ({ initial, onSave, onCancel }: { initial: Partial<PaymentMethod>; onSave: (d: Partial<PaymentMethod>) => void; onCancel: () => void }) => {
    const [form, setForm] = useState(initial)
    return (
      <Card className="border-muted mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={form.type || "crypto"} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Label</label>
              <Input value={form.label || ""} onChange={e => setForm({...form, label: e.target.value})} />
            </div>
            {form.type === "crypto" && (
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Wallet Address</label>
                <Input value={form.walletAddress || ""} onChange={e => setForm({...form, walletAddress: e.target.value})} placeholder="Enter wallet address..." />
              </div>
            )}
            {form.type === "bank" && (
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Bank Details (JSON)</label>
                <Textarea value={form.bankDetails || ""} onChange={e => setForm({...form, bankDetails: e.target.value})} rows={3} placeholder='{"bank":"...","account":"...","routing":"..."}' />
              </div>
            )}
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Instructions</label>
              <Textarea value={form.instructions || ""} onChange={e => setForm({...form, instructions: e.target.value})} rows={2} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onSave(form)} size="sm"><Check className="mr-1 h-4 w-4" /> Save</Button>
            <Button onClick={onCancel} variant="ghost" size="sm"><X className="mr-1 h-4 w-4" /> Cancel</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Payment Methods</h2>
        <Button onClick={() => { setCreating(true); setEditing(null) }} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" /> Add Method
        </Button>
      </div>

      {creating && <MethodForm initial={{ type: "crypto", label: "", isActive: true, sortOrder: 0 }} onSave={(d) => saveMethod(d)} onCancel={() => setCreating(false)} />}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 mb-4" />)
      ) : methods.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No payment methods configured</p>
      ) : (
        methods.map((m) => (
          <Card key={m.id} className={`border-muted mb-4 ${m.isActive ? "" : "opacity-60"}`}>
            <CardContent className="p-4">
              {editing === m.id ? (
                <MethodForm initial={m} onSave={(d) => saveMethod(d, m.id)} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    {m.type === "crypto" ? <Wallet className="h-5 w-5 text-primary mt-1" /> : <Landmark className="h-5 w-5 text-primary mt-1" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{m.label}</p>
                        <Badge variant="outline" className="text-xs">{m.type}</Badge>
                      </div>
                      {m.walletAddress && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          <span className="text-primary">Wallet:</span> {m.walletAddress}
                        </p>
                      )}
                      {m.bankDetails && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-primary">Bank:</span> {m.bankDetails}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={m.isActive} onCheckedChange={() => saveMethod({ isActive: !m.isActive }, m.id)} />
                    <Button variant="ghost" size="icon" onClick={() => setEditing(m.id)}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMethod(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { Plus, Edit3, Trash2, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface Plan {
  id: string
  name: string
  badge: string
  minAmount: number
  maxAmount: number
  durationDays: number
  roiPercent: number
  dailyRoiPercent: number
  referralBonus: number
  description: string
  features: string[]
  isActive: boolean
  sortOrder: number
}

const emptyPlan = {
  name: "", badge: "", minAmount: 0, maxAmount: 0, durationDays: 30, roiPercent: 0,
  dailyRoiPercent: 0, referralBonus: 5, description: "", features: [], isActive: true, sortOrder: 0,
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const fetchPlans = async () => {
    setLoading(true)
    const res = await api.get<{ plans: Plan[] }>("/api/admin/plans")
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { setPlans(res.data?.plans ?? []) }
    setLoading(false)
  }

  useEffect(() => { fetchPlans() }, [])

  const savePlan = async (plan: Partial<Plan>) => {
    if (creating) {
      const res = await api.post("/api/admin/plans", plan)
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      toast({ title: "Created" })
    } else if (editing) {
      const res = await api.put(`/api/admin/plans/${editing.id}`, plan)
      if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
      toast({ title: "Updated" })
    }
    setEditing(null); setCreating(false); fetchPlans()
  }

  const deletePlan = async (id: string) => {
    const res = await api.delete(`/api/admin/plans/${id}`)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }); return }
    toast({ title: "Deleted" })
    fetchPlans()
  }

  const toggleActive = async (plan: Plan) => {
    await savePlan({ ...plan, isActive: !plan.isActive })
  }

  const PlanForm = ({ plan, onSave, onCancel }: { plan: Partial<Plan>; onSave: (p: Partial<Plan>) => void; onCancel: () => void }) => {
    const [form, setForm] = useState(plan)
    return (
      <Card className="border-muted">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Name</label><Input value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className="text-xs text-muted-foreground">Badge</label><Input value={form.badge || ""} onChange={e => setForm({...form, badge: e.target.value})} /></div>
            <div><label className="text-xs text-muted-foreground">Min Amount ($)</label><Input type="number" value={form.minAmount || 0} onChange={e => setForm({...form, minAmount: Number(e.target.value)})} /></div>
            <div><label className="text-xs text-muted-foreground">Max Amount ($)</label><Input type="number" value={form.maxAmount || 0} onChange={e => setForm({...form, maxAmount: Number(e.target.value)})} /></div>
            <div><label className="text-xs text-muted-foreground">Duration (days)</label><Input type="number" value={form.durationDays || 30} onChange={e => setForm({...form, durationDays: Number(e.target.value)})} /></div>
            <div><label className="text-xs text-muted-foreground">ROI (%)</label><Input type="number" step="0.01" value={form.roiPercent || 0} onChange={e => setForm({...form, roiPercent: Number(e.target.value)})} /></div>
            <div><label className="text-xs text-muted-foreground">Daily ROI (%)</label><Input type="number" step="0.01" value={form.dailyRoiPercent || 0} onChange={e => setForm({...form, dailyRoiPercent: Number(e.target.value)})} /></div>
            <div><label className="text-xs text-muted-foreground">Referral Bonus (%)</label><Input type="number" step="0.01" value={form.referralBonus || 5} onChange={e => setForm({...form, referralBonus: Number(e.target.value)})} /></div>
          </div>
          <div><label className="text-xs text-muted-foreground">Description</label><Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
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
        <h2 className="text-3xl font-bold tracking-tight">Investment Plans</h2>
        <Button onClick={() => { setCreating(true); setEditing(null) }} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" /> New Plan
        </Button>
      </div>

      {creating && <PlanForm plan={emptyPlan} onSave={savePlan} onCancel={() => setCreating(false)} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
        ) : plans.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">No plans created</p>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className={`border-muted ${plan.isActive ? "" : "opacity-60"}`}>
              <CardContent className="p-4">
                {editing?.id === plan.id ? (
                  <PlanForm plan={plan} onSave={savePlan} onCancel={() => setEditing(null)} />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        {plan.badge && <Badge variant="warning" className="mt-1">{plan.badge}</Badge>}
                      </div>
                      <Switch checked={plan.isActive} onCheckedChange={() => toggleActive(plan)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Min:</span> {formatCurrency(Number(plan.minAmount))}</div>
                      <div><span className="text-muted-foreground">Max:</span> {plan.maxAmount ? formatCurrency(Number(plan.maxAmount)) : "∞"}</div>
                      <div><span className="text-muted-foreground">Duration:</span> {plan.durationDays}d</div>
                      <div><span className="text-muted-foreground">ROI:</span> {Number(plan.roiPercent)}%</div>
                    </div>
                    {plan.description && <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(plan)}><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

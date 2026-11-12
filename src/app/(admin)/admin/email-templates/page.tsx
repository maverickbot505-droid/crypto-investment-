"use client"
import { useState, useEffect } from "react"
import { Save, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { api } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"

interface Template {
  id: string
  type: string
  subject: string
  body: string
}

const templateLabels: Record<string, string> = {
  WELCOME: "Welcome Email",
  VERIFY_EMAIL: "Verify Email",
  RESET_PASSWORD: "Password Reset",
  DEPOSIT_CONFIRMED: "Deposit Confirmed",
  WITHDRAWAL_CONFIRMED: "Withdrawal Confirmed",
  INVESTMENT_ACTIVATED: "Investment Activated",
  INVESTMENT_COMPLETED: "Investment Completed",
  KYC_APPROVED: "KYC Approved",
  KYC_REJECTED: "KYC Rejected",
  TWO_FACTOR_CODE: "2FA Code",
  ACCOUNT_SUSPENDED: "Account Suspended",
  ACCOUNT_UNSUSPENDED: "Account Unsuspended",
  REFERRAL_CREDIT: "Referral Credit",
  LOGIN_NOTIFICATION: "Login Notification",
}

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("")
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setLoading(true)
    const res = await api.get<{ templates: Template[] }>("/api/admin/email-templates")
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else {
      setTemplates(res.data?.templates ?? [])
      if (!activeTab && res.data?.templates?.length) {
        setActiveTab(res.data.templates[0].type)
      }
    }
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const updateTemplate = (type: string, field: "subject" | "body", value: string) => {
    setTemplates((prev) => prev.map((t) => (t.type === type ? { ...t, [field]: value } : t)))
  }

  const saveTemplate = async (type: string) => {
    const t = templates.find((t) => t.type === type)
    if (!t) return
    setSaving(true)
    const res = await api.put(`/api/admin/email-templates/${t.id}`, { subject: t.subject, body: t.body })
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Saved", description: `${templateLabels[type] || type} updated` }) }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
        <Card className="border-muted">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}><Skeleton className="h-10 w-full" /></div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
      </div>

      <Card className="border-muted">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
              {templates.map((t) => (
                <TabsTrigger key={t.type} value={t.type} className="text-xs">
                  {templateLabels[t.type] || t.type}
                </TabsTrigger>
              ))}
            </TabsList>

            {templates.map((t) => (
              <TabsContent key={t.type} value={t.type} className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{templateLabels[t.type] || t.type}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available variables: <code>{`{{firstName}} {{lastName}} {{email}} {{amount}} {{code}}`}</code>
                </p>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Subject</label>
                  <Input value={t.subject} onChange={(e) => updateTemplate(t.type, "subject", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Body (HTML or plain text)</label>
                  <Textarea value={t.body} onChange={(e) => updateTemplate(t.type, "body", e.target.value)} rows={12} className="font-mono text-sm" />
                </div>
                <Button onClick={() => saveTemplate(t.type)} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> Save {templateLabels[t.type] || t.type}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"

const defaultKeys = [
  "site_name", "site_description", "support_email", "min_deposit", "max_deposit",
  "min_withdrawal", "max_withdrawal", "withdrawal_fee_percent", "referral_bonus_percent",
  "currency_symbol", "currency_code",
]

const apiKeys = [
  "coingecko_api_key",
]

const labels: Record<string, string> = {
  site_name: "Site Name",
  site_description: "Site Description",
  support_email: "Support Email",
  min_deposit: "Min Deposit ($)",
  max_deposit: "Max Deposit ($)",
  min_withdrawal: "Min Withdrawal ($)",
  max_withdrawal: "Max Withdrawal ($)",
  withdrawal_fee_percent: "Withdrawal Fee (%)",
  referral_bonus_percent: "Referral Bonus (%)",
  currency_symbol: "Currency Symbol",
  currency_code: "Currency Code",
  coingecko_api_key: "CoinGecko API Key",
}

const multiline = ["site_description"]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const fetchSettings = async () => {
    setLoading(true)
    const res = await api.get<{ settings: Record<string, string> }>("/api/admin/settings")
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { setSettings(res.data?.settings ?? {}) }
    setLoading(false)
  }

  useEffect(() => { fetchSettings() }, [])

  const saveSettings = async () => {
    setSaving(true)
    const entries = Object.entries(settings).map(([key, value]) => ({ key, value }))
    const res = await api.put("/api/admin/settings", { settings: entries })
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else { toast({ title: "Success", description: "Settings saved" }) }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Site Settings</h2>
        <Button onClick={saveSettings} disabled={saving || loading}>
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>
      <Card className="border-muted">
        <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i}><Skeleton className="h-10 w-full" /></div>
            ))
          ) : (
            defaultKeys.map((key) => (
              <div key={key}>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">{labels[key] || key}</label>
                {multiline.includes(key) ? (
                  <Textarea
                    value={settings[key] || ""}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={settings[key] || ""}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardHeader><CardTitle className="text-lg">Market Data API</CardTitle></CardHeader>
        <CardContent className="p-6 space-y-4">
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">{labels.coingecko_api_key}</label>
                <Input
                  value={settings.coingecko_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, coingecko_api_key: e.target.value })}
                  placeholder="Enter your CoinGecko API key"
                />
                <p className="text-xs text-muted-foreground mt-1">Used for real market prices. Leave empty for mock data.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Data Source</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={settings.market_data_source || "mock"}
                  onChange={(e) => setSettings({ ...settings, market_data_source: e.target.value })}
                >
                  <option value="mock">Mock Data (Simulated)</option>
                  <option value="live">Live Data (CoinGecko)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Live data requires a valid CoinGecko API key.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"

interface KYCItem {
  id: string
  userId: string
  status: string
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  address: string
  idType: string
  idFrontUrl: string
  idBackUrl: string
  selfieUrl: string
  poaUrl: string
  reviewNote: string
  createdAt: string
  user: { id: string; email: string; firstName: string; lastName: string; kycStatus: string }
}

export default function AdminKYCPage() {
  const [records, setRecords] = useState<KYCItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<KYCItem | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const fetchKYC = async () => {
    setLoading(true)
    const res = await api.get<{ kycRecords: KYCItem[] }>("/api/admin/kyc")
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    } else {
      setRecords(res.data?.kycRecords ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchKYC() }, [])

  const handleReview = async (kycId: string, status: string) => {
    setProcessing(true)
    const res = await api.patch(`/api/admin/kyc/${kycId}`, { status, adminNote })
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    } else {
      toast({ title: "Success", description: `KYC ${status}` })
      setSelected(null)
      setAdminNote("")
      fetchKYC()
    }
    setProcessing(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">KYC Verification</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-muted">
          <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>
                ))
              ) : records.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">No KYC applications</p>
              ) : (
                records.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setAdminNote(r.reviewNote || "") }}
                    className={`w-full p-4 text-left transition-colors hover:bg-muted/30 ${selected?.id === r.id ? "bg-muted/50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{r.firstName} {r.lastName}</p>
                        <p className="text-xs text-muted-foreground">{r.user?.email}</p>
                      </div>
                      <Badge variant={r.status === "PENDING" ? "warning" : r.status === "APPROVED" ? "success" : "destructive"}>
                        {r.status}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader><CardTitle>Review Details</CardTitle></CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-center text-muted-foreground py-8">Select an application to review</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selected.firstName} {selected.lastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nationality</p>
                    <p className="font-medium">{selected.nationality || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID Type</p>
                    <p className="font-medium">{selected.idType || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-sm">{selected.address || "-"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.idFrontUrl && (
                    <a href={selected.idFrontUrl} target="_blank" className="text-xs text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> ID Front
                    </a>
                  )}
                  {selected.idBackUrl && (
                    <a href={selected.idBackUrl} target="_blank" className="text-xs text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> ID Back
                    </a>
                  )}
                  {selected.selfieUrl && (
                    <a href={selected.selfieUrl} target="_blank" className="text-xs text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Selfie
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Note</p>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Optional note..."
                    rows={3}
                  />
                </div>
                {selected.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleReview(selected.id, "approved")} disabled={processing} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button onClick={() => handleReview(selected.id, "rejected")} disabled={processing} variant="destructive" className="flex-1">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

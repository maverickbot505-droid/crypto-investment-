"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  UserCheck,
  FileText,
  Camera,
  MapPin,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { KYCType } from "@/types"

type KycFormData = {
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
}

const initialFormData: KycFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  nationality: "",
  address: "",
  idType: "",
  idFrontUrl: "",
  idBackUrl: "",
  selfieUrl: "",
  poaUrl: "",
}

const steps = [
  { id: 1, title: "Personal Info", icon: UserCheck },
  { id: 2, title: "ID Document", icon: FileText },
  { id: 3, title: "Selfie", icon: Camera },
  { id: 4, title: "Proof of Address", icon: MapPin },
]

export default function KycPage() {
  const [existingKyc, setExistingKyc] = useState<KYCType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<KycFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof KycFormData, string>>>({})

  async function fetchKyc() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ kyc: KYCType | null }>("/api/kyc")
      if (res.error) throw new Error(res.error)
      if (res.data?.kyc) {
        setExistingKyc(res.data.kyc)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KYC data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKyc()
  }, [])

  function validateStep(step: number): boolean {
    const newErrors: Partial<Record<keyof KycFormData, string>> = {}
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
      if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required"
      if (!formData.address.trim()) newErrors.address = "Address is required"
    } else if (step === 2) {
      if (!formData.idType) newErrors.idType = "ID type is required"
      if (!formData.idFrontUrl.trim()) newErrors.idFrontUrl = "Front image URL is required"
      if (!formData.idBackUrl.trim()) newErrors.idBackUrl = "Back image URL is required"
    } else if (step === 3) {
      if (!formData.selfieUrl.trim()) newErrors.selfieUrl = "Selfie URL is required"
    } else if (step === 4) {
      if (!formData.poaUrl.trim()) newErrors.poaUrl = "Proof of address URL is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setErrors({})
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return
    setSubmitting(true)
    try {
      const res = await api.post("/api/kyc", {
        documentType: formData.idType,
        documentNumber: `${formData.firstName} ${formData.lastName}`,
        fullName: `${formData.firstName} ${formData.lastName}`,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        frontImage: formData.idFrontUrl,
        backImage: formData.idBackUrl || undefined,
        selfieImage: formData.selfieUrl || undefined,
      })
      if (res.error) {
        toast({ title: "KYC submission failed", description: res.error, variant: "destructive" })
        return
      }
      toast({ title: "KYC submitted!", description: "Your documents are being reviewed." })
      setExistingKyc({
        id: "",
        userId: "",
        status: "PENDING",
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth),
        nationality: formData.nationality,
        address: formData.address,
        idType: formData.idType,
        idFrontUrl: formData.idFrontUrl,
        idBackUrl: formData.idBackUrl,
        selfieUrl: formData.selfieUrl,
        poaUrl: formData.poaUrl,
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setFormData(initialFormData)
      setCurrentStep(1)
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: keyof KycFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  if (loading) return <KycSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive/60 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={fetchKyc}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (existingKyc) {
    return <KycStatusDisplay kyc={existingKyc} onReset={() => { setExistingKyc(null); fetchKyc() }} />
  }

  const stepProgress = (currentStep / 4) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold">KYC Verification</h1>
        <p className="text-sm text-muted-foreground">
          Complete your identity verification to start investing
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                      currentStep === s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep > s.id
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {currentStep > s.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block text-muted-foreground">
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={stepProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Step {currentStep} of 4
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive">{errors.dateOfBirth}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      placeholder="e.g. United States"
                      value={formData.nationality}
                      onChange={(e) => updateField("nationality", e.target.value)}
                    />
                    {errors.nationality && (
                      <p className="text-sm text-destructive">{errors.nationality}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Your full residential address"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Type</Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(v) => updateField("idType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.idType && (
                      <p className="text-sm text-destructive">{errors.idType}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idFrontUrl">ID Front Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="idFrontUrl"
                        placeholder="https://..."
                        value={formData.idFrontUrl}
                        onChange={(e) => updateField("idFrontUrl", e.target.value)}
                      />
                    </div>
                    {errors.idFrontUrl && (
                      <p className="text-sm text-destructive">{errors.idFrontUrl}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idBackUrl">ID Back Image URL</Label>
                    <Input
                      id="idBackUrl"
                      placeholder="https://..."
                      value={formData.idBackUrl}
                      onChange={(e) => updateField("idBackUrl", e.target.value)}
                    />
                    {errors.idBackUrl && (
                      <p className="text-sm text-destructive">{errors.idBackUrl}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="selfieUrl">Selfie Image URL</Label>
                    <p className="text-xs text-muted-foreground">
                      Upload a clear photo of yourself holding your ID document
                    </p>
                    <Input
                      id="selfieUrl"
                      placeholder="https://..."
                      value={formData.selfieUrl}
                      onChange={(e) => updateField("selfieUrl", e.target.value)}
                    />
                    {errors.selfieUrl && (
                      <p className="text-sm text-destructive">{errors.selfieUrl}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="poaUrl">Proof of Address URL</Label>
                    <p className="text-xs text-muted-foreground">
                      Upload a recent utility bill, bank statement, or official document
                      showing your name and address (not older than 3 months)
                    </p>
                    <Input
                      id="poaUrl"
                      placeholder="https://..."
                      value={formData.poaUrl}
                      onChange={(e) => updateField("poaUrl", e.target.value)}
                    />
                    {errors.poaUrl && (
                      <p className="text-sm text-destructive">{errors.poaUrl}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit KYC
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function KycStatusDisplay({ kyc, onReset }: { kyc: KYCType; onReset: () => void }) {
  const statusConfig: Record<KYCType["status"], {
    icon: typeof Clock
    color: string
    bg: string
    badge: "warning" | "success" | "destructive"
    title: string
    message: string
  }> = {
    PENDING: {
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      badge: "warning",
      title: "Pending Review",
      message: "Your documents are being reviewed. This usually takes 1-3 business days.",
    },
    APPROVED: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      badge: "success",
      title: "Verified",
      message: "Your identity has been verified. You can now access all platform features.",
    },
    REJECTED: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      badge: "destructive",
      title: "Verification Failed",
      message: kyc.reviewNote ?? "Your documents did not pass verification. Please resubmit.",
    },
  }

  const config = statusConfig[kyc.status] ?? statusConfig.PENDING
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <Card>
        <CardContent className="p-8 text-center">
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${config.bg}`}
          >
            <Icon className={`h-10 w-10 ${config.color}`} />
          </div>

          <Badge variant={config.badge} className="mb-4">
            {kyc.status}
          </Badge>

          <h2 className="text-2xl font-display font-bold mb-2">{config.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{config.message}</p>

          <div className="space-y-2 text-sm text-left border rounded-lg p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {kyc.firstName} {kyc.lastName}
                </span>
              </div>
              {kyc.nationality && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nationality</span>
                  <span className="font-medium">{kyc.nationality}</span>
                </div>
              )}
              {kyc.idType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Type</span>
                  <span className="font-medium capitalize">
                    {kyc.idType.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>

          {kyc.status === "REJECTED" && (
            <Button onClick={onReset} className="w-full">
              Resubmit KYC
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function KycSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto mt-2" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-2 w-full mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

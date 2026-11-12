"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import {
  CreditCard,
  Banknote,
  Bitcoin,
  Coins,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowDownToLine,
  Copy,
  Check,
  Wallet,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, timeAgo } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { TransactionType } from "@/types"

const depositFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 10, "Minimum deposit is $10"),
  note: z.string().optional(),
})

type DepositFormInput = z.infer<typeof depositFormSchema>

type PaymentMethod = {
  id: string
  name: string
  icon: typeof CreditCard
  description: string
  walletAddress?: string
  instructions?: string[]
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "stripe",
    name: "Stripe",
    icon: CreditCard,
    description: "Pay with credit or debit card",
    instructions: ["Select Stripe as payment method.", "Enter your card details on the next screen.", "Payment is processed instantly."],
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Banknote,
    description: "Direct bank wire transfer",
    instructions: [
      "Bank: Chase Bank",
      "Account Name: InvestPro Inc.",
      "Account Number: ****4532",
      "Routing: 021000021",
      "SWIFT: CHASUS33",
      "Include your user ID as reference.",
    ],
  },
  {
    id: "crypto_btc",
    name: "Bitcoin",
    icon: Bitcoin,
    description: "Deposit with Bitcoin",
    walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  },
  {
    id: "crypto_eth",
    name: "Ethereum",
    icon: Coins,
    description: "Deposit with Ethereum",
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  },
  {
    id: "crypto_usdt",
    name: "USDT (ERC-20)",
    icon: DollarSign,
    description: "Deposit with USDT",
    walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  },
]

export default function DepositPage() {
  const [deposits, setDeposits] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepositFormInput>({
    resolver: zodResolver(depositFormSchema),
  })

  async function fetchDeposits() {
    try {
      const res = await api.get<{ deposits: TransactionType[] }>("/api/deposits")
      if (res.error) throw new Error(res.error)
      setDeposits(res.data!.deposits)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deposits")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
  }, [])

  async function onSubmit(data: DepositFormInput) {
    if (!selectedMethod) {
      toast({ title: "Method required", description: "Please select a payment method", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post("/api/deposits", {
        amount: Number(data.amount),
        paymentMethodId: selectedMethod,
        transactionId: data.note || undefined,
      })
      if (res.error) {
        toast({ title: "Deposit failed", description: res.error, variant: "destructive" })
        return
      }
      toast({ title: "Deposit submitted!", description: "Your deposit request is pending approval." })
      reset({ amount: "", note: "" })
      setSelectedMethod(null)
      fetchDeposits()
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast({ title: "Copied!", description: "Address copied to clipboard" })
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" })
    }
  }

  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Deposit Funds</h1>
        <p className="text-sm text-muted-foreground">Add funds to your investment account</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
              <CardDescription>Select how you want to deposit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method) => {
                  const isSelected = selectedMethod === method.id
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-4 text-left transition-all text-sm",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-accent/30"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg p-2",
                          isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <method.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deposit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      className="pl-9"
                      placeholder="0.00"
                      {...register("amount")}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note / Transaction ID (optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Enter any reference or transaction ID..."
                    {...register("note")}
                  />
                </div>

                {selectedMethodData?.walletAddress && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Send to this {selectedMethodData.name} address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-background px-3 py-2 text-xs break-all font-mono">
                        {selectedMethodData.walletAddress}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          copyToClipboard(selectedMethodData.walletAddress!, selectedMethod ?? "")
                        }
                      >
                        {copiedId === selectedMethod ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Send the exact deposit amount to this address. Funds will be credited after
                      network confirmations.
                    </p>
                  </div>
                )}

                {selectedMethodData?.instructions && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-medium">Bank Transfer Instructions</p>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      {selectedMethodData.instructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                    <p className="text-xs text-muted-foreground mt-2">
                      Processing time: 1-3 business days.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !selectedMethod}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="mr-2 h-4 w-4" />
                      Submit Deposit Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Deposits</CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchDeposits}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive/60 mb-2" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              ) : deposits.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No deposits yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(deposit.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {deposit.method?.replace(/_/g, " ").replace("crypto ", "") ?? "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            deposit.status === "APPROVED"
                              ? "success"
                              : deposit.status === "REJECTED"
                                ? "destructive"
                                : "warning"
                          }
                          className="capitalize text-xs"
                        >
                          {deposit.status.toLowerCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeAgo(deposit.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import {
  ArrowUpFromLine,
  DollarSign,
  Wallet,
  Banknote,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  Clock,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, timeAgo } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import type { UserType, TransactionType } from "@/types"

const withdrawFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, "Minimum withdrawal is $1"),
  method: z.string().min(1, "Method is required"),
  accountDetails: z.string().min(10, "Please provide complete account details"),
})

type WithdrawFormInput = z.infer<typeof withdrawFormSchema>

const WITHDRAWAL_FEE_PERCENT = 1
const PROCESSING_TIME = "1-3 business days"

export default function WithdrawPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [withdrawals, setWithdrawals] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WithdrawFormInput>({
    resolver: zodResolver(withdrawFormSchema),
  })

  const amount = Number(watch("amount")) || 0
  const method = watch("method")
  const fee = amount * (WITHDRAWAL_FEE_PERCENT / 100)
  const totalDeduction = amount + fee
  const hasSufficientBalance = user ? totalDeduction <= user.balance : false

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [userRes, withdrawalsRes] = await Promise.all([
        api.get<{ user: UserType }>("/api/users"),
        api.get<{ withdrawals: TransactionType[] }>("/api/withdrawals"),
      ])
      if (userRes.error) throw new Error(userRes.error)
      if (withdrawalsRes.error) throw new Error(withdrawalsRes.error)
      setUser(userRes.data!.user)
      setWithdrawals(withdrawalsRes.data!.withdrawals)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load withdrawal data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function onSubmit(data: WithdrawFormInput) {
    if (!user) return
    const amt = Number(data.amount)
    if (amt + fee > user.balance) {
      toast({
        title: "Insufficient balance",
        description: `You need ${formatCurrency(amt + fee)} including fees`,
        variant: "destructive",
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post("/api/withdrawals", {
        amount: amt,
        paymentMethodId: data.method,
        accountDetails: data.accountDetails,
      })
      if (res.error) {
        toast({ title: "Withdrawal failed", description: res.error, variant: "destructive" })
        return
      }
      toast({
        title: "Withdrawal submitted!",
        description: "Your withdrawal request is being processed.",
      })
      reset({ amount: "", method: "", accountDetails: "" })
      fetchData()
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <WithdrawSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive/60 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const minWithdrawal = 1
  const maxWithdrawal = user?.balance ?? 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Withdraw Funds</h1>
        <p className="text-sm text-muted-foreground">Withdraw your earnings and balance</p>
      </div>

      {user && user.kycStatus !== "APPROVED" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Info className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm">
              KYC approval is required to make withdrawals.{" "}
              <a href="/kyc" className="text-primary hover:underline font-medium">
                Complete KYC
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {formatCurrency(user?.balance ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available for withdrawal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Withdrawal Details</CardTitle>
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
                  <p className="text-xs text-muted-foreground">
                    Min: {formatCurrency(minWithdrawal)} | Max:{" "}
                    {formatCurrency(maxWithdrawal)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Withdrawal Method</Label>
                  <Select
                    onValueChange={(v) => setValue("method", v)}
                    value={method}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          Bank Transfer
                        </div>
                      </SelectItem>
                      <SelectItem value="crypto_wallet">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Crypto Wallet
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.method && (
                    <p className="text-sm text-destructive">{errors.method.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountDetails">
                    {method === "crypto_wallet" ? "Wallet Address" : "Account Details"}
                  </Label>
                  <Textarea
                    id="accountDetails"
                    placeholder={
                      method === "crypto_wallet"
                        ? "Enter your wallet address..."
                        : "Bank name, account name, account number, routing number..."
                    }
                    {...register("accountDetails")}
                  />
                  {errors.accountDetails && (
                    <p className="text-sm text-destructive">
                      {errors.accountDetails.message}
                    </p>
                  )}
                </div>

                {amount > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-medium">Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Withdrawal Amount</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Fee ({WITHDRAWAL_FEE_PERCENT}%)
                      </span>
                      <span className="text-destructive">{formatCurrency(fee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Deduction</span>
                      <span className={hasSufficientBalance ? "text-green-500" : "text-destructive"}>
                        {formatCurrency(totalDeduction)}
                      </span>
                    </div>
                    {!hasSufficientBalance && (
                      <p className="text-xs text-destructive">
                        Insufficient balance for this withdrawal
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Processing time: {PROCESSING_TIME}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    submitting || !hasSufficientBalance || (user?.kycStatus !== "APPROVED" && user !== null)
                  }
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="mr-2 h-4 w-4" />
                      Submit Withdrawal Request
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
              <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ArrowUpFromLine className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No withdrawals yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(w.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {w.method?.replace(/_/g, " ") ?? "N/A"}
                        </p>
                        {w.fee > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Fee: {formatCurrency(w.fee)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            w.status === "APPROVED"
                              ? "success"
                              : w.status === "REJECTED"
                                ? "destructive"
                                : "warning"
                          }
                          className="capitalize text-xs"
                        >
                          {w.status.toLowerCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeAgo(w.createdAt)}
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

function WithdrawSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-14 w-48" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

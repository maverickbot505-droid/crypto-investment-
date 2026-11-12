"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Loader2, Mail, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validators/auth"
import type { ForgotPasswordInput, ResetPasswordInput } from "@/lib/validators/auth"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

const steps = ["Email", "Verify OTP", "New Password", "Done"]

const stepDescriptions = [
  "Enter your registered email address",
  "Check your email for the verification code",
  "Create a new strong password",
  "Your password has been reset successfully",
]

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [token, setToken] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const forgotForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: "", password: "", confirmPassword: "" },
  })

  const startCountdown = useCallback(() => {
    setCountdown(60)
    setCanResend(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function handleEmailSubmit(data: ForgotPasswordInput) {
    try {
      const res = await api.post("/api/auth/forgot-password", { email: data.email })
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" })
        return
      }
      setEmail(data.email)
      setStep(1)
      startCountdown()
      toast({ title: "Code sent!", description: "Check your email for the OTP." })
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      document.getElementById(`fotp-${index + 1}`)?.focus()
    }

    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      handleOtpVerify(newOtp.join(""))
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`fotp-${index - 1}`)?.focus()
    }
  }

  async function handleOtpVerify(code: string) {
    try {
      const res = await api.post("/api/auth/verify-otp", { code, email, type: "password-reset" })
      if (res.error) {
        toast({ title: "Invalid code", description: res.error, variant: "destructive" })
        return
      }
      setToken(code)
      resetForm.setValue("token", code)
      setStep(2)
      toast({ title: "Verified!", description: "Now set your new password." })
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  async function handleResend() {
    if (!canResend || isResending) return
    setIsResending(true)
    try {
      await api.post("/api/auth/forgot-password", { email })
      toast({ title: "Code resent", description: "Check your email." })
      startCountdown()
    } catch {
      toast({ title: "Error", description: "Failed to resend", variant: "destructive" })
    } finally {
      setIsResending(false)
    }
  }

  async function handleResetSubmit(data: ResetPasswordInput) {
    try {
      const res = await api.post("/api/auth/reset-password", {
        token: data.token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      })
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" })
        return
      }
      setStep(3)
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>{stepDescriptions[step]}</CardDescription>
          <div className="pt-4">
            <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Step {step + 1} of {steps.length}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.form
                key="step-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={forgotForm.handleSubmit(handleEmailSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      {...forgotForm.register("email")}
                    />
                  </div>
                  {forgotForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={forgotForm.formState.isSubmitting} size="lg">
                  {forgotForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </motion.form>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`fotp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="h-14 w-12 text-center text-lg font-bold"
                    />
                  ))}
                </div>
                <div className="text-center">
                  {canResend ? (
                    <Button variant="link" onClick={handleResend} disabled={isResending} className="text-sm">
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        "Resend code"
                      )}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Resend in <span className="font-medium text-foreground">{countdown}s</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={resetForm.handleSubmit(handleResetSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      {...resetForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      {...resetForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting} size="lg">
                  {resetForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold">Password Reset!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your password has been successfully reset.
                  </p>
                </div>
                <Button asChild className="w-full" size="lg">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        {step < 3 && (
          <CardFooter>
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

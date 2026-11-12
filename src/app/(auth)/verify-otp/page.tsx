"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { TrendingUp, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { otpSchema, type OtpInput } from "@/lib/validators/auth"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const type = searchParams.get("type") || "verification"

  const [otpValue, setOtpValue] = useState<string[]>(Array(6).fill(""))
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
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
    startCountdown()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startCountdown])

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpValue]
    newOtp[index] = value.slice(-1)
    setOtpValue(newOtp)
    const code = newOtp.join("")
    setValue("otp", code)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = pasted.split("").concat(Array(6).fill("")).slice(0, 6)
    setOtpValue(newOtp)
    setValue("otp", newOtp.join(""))
    const nextEmpty = newOtp.findIndex((v) => !v)
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty
    document.getElementById(`otp-${focusIdx}`)?.focus()
  }

  async function onSubmit() {
    const code = otpValue.join("")
    if (code.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter all 6 digits", variant: "destructive" })
      return
    }

    try {
      const res = await api.post("/api/auth/verify-otp", { code, email, type })

      if (res.error) {
        toast({ title: "Verification failed", description: res.error, variant: "destructive" })
        return
      }

      toast({
        title: "Verified!",
        description: type === "password-reset" ? "You can now reset your password." : "Your email has been verified.",
      })

      if (type === "password-reset") {
        router.push(`/forgot-password?step=3&email=${encodeURIComponent(email)}&token=${code}`)
      } else {
        router.push("/login")
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  async function handleResend() {
    if (!canResend || isResending) return
    setIsResending(true)
    try {
      const endpoint =
        type === "password-reset" ? "/api/auth/forgot-password" : "/api/auth/register"
      await api.post(endpoint, { email })
      toast({ title: "OTP resent", description: "Check your email for the new code." })
      startCountdown()
    } catch {
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" })
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No email provided. Please start the verification process again.</p>
          <Button className="mt-4" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-4 flex justify-center"
          >
            <TrendingUp className="h-8 w-8 text-primary" />
          </motion.div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center justify-center gap-2 mb-8" onPaste={handlePaste}>
              {otpValue.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-14 w-12 text-center text-lg font-bold"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center">
            {canResend ? (
              <Button
                variant="link"
                onClick={handleResend}
                disabled={isResending}
                className="text-sm"
              >
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
                Resend code in <span className="font-medium text-foreground">{countdown}s</span>
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild className="w-full">
            <a href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  )
}

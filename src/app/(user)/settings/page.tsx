"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import {
  User,
  Lock,
  Shield,
  Copy,
  Check,
  Moon,
  Sun,
  Link as LinkIcon,
  Users,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import { profileSchema, type ProfileInput } from "@/lib/validators/auth"
import { useThemeStore } from "@/lib/store"
import type { UserType } from "@/types"

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordInput = z.infer<typeof passwordSchema>

type SettingsUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isTwoFactorEnabled: boolean
}

export default function SettingsPage() {
  const [settingsUser, setSettingsUser] = useState<SettingsUser | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { isDark, toggle: toggleTheme } = useThemeStore()

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  })

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [settingsRes, userRes] = await Promise.all([
        api.get<{ user: SettingsUser }>("/api/auth/settings"),
        api.get<{ user: UserType }>("/api/users"),
      ])
      if (settingsRes.error) throw new Error(settingsRes.error)
      if (userRes.error) throw new Error(userRes.error)

      const su = settingsRes.data!.user
      const u = userRes.data!.user
      setSettingsUser(su)
      setUser(u)
      profileForm.reset({
        firstName: su.firstName,
        lastName: su.lastName,
        phone: su.phone ?? "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function onProfileSubmit(data: ProfileInput) {
    setProfileSubmitting(true)
    try {
      const res = await api.put("/api/auth/settings", {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      })
      if (res.error) {
        toast({ title: "Update failed", description: res.error, variant: "destructive" })
        return
      }
      toast({ title: "Profile updated", description: "Your profile has been saved." })
      fetchData()
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setProfileSubmitting(false)
    }
  }

  async function onPasswordSubmit(data: PasswordInput) {
    setPasswordSubmitting(true)
    try {
      const res = await api.post("/api/auth/settings/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      if (res.error) {
        toast({ title: "Password change failed", description: res.error, variant: "destructive" })
        return
      }
      toast({ title: "Password changed", description: "Your password has been updated." })
      passwordForm.reset()
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setPasswordSubmitting(false)
    }
  }

  async function onToggle2fa(checked: boolean) {
    try {
      const res = await api.post("/api/auth/settings/toggle-2fa", { enabled: checked })
      if (res.error) {
        toast({ title: "Failed to update 2FA", description: res.error, variant: "destructive" })
        return
      }
      toast({
        title: checked ? "2FA enabled" : "2FA disabled",
        description: checked
          ? "Two-factor authentication is now active."
          : "Two-factor authentication has been disabled.",
      })
      fetchData()
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  async function copyReferralLink() {
    if (!user) return
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/register?ref=${user.referralCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Copied!", description: "Referral link copied to clipboard" })
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" })
    }
  }

  if (loading) return <SettingsSkeleton />
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive/60 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load settings</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...profileForm.register("firstName")} />
                {profileForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...profileForm.register("lastName")} />
                {profileForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" {...profileForm.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={settingsUser?.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button type="submit" disabled={profileSubmitting}>
              {profileSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  {...passwordForm.register("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  {...passwordForm.register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  {...passwordForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={passwordSubmitting}>
              {passwordSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Security</CardTitle>
              <CardDescription>Two-factor authentication settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settingsUser?.isTwoFactorEnabled ?? false}
              onCheckedChange={onToggle2fa}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Referral Program</CardTitle>
              <CardDescription>Share your referral link and earn bonuses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Your Referral Link</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border bg-muted px-3 py-2.5 text-sm truncate">
                {`${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/register?ref=${user?.referralCode ?? ""}`}
              </code>
              <Button variant="outline" size="icon" onClick={copyReferralLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{(user as UserType & { referralCount?: number })?.referralCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {formatCurrency(user?.referralEarnings ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Earnings</p>
            </div>
          </div>

          <div className="rounded-lg border p-4 text-center">
            <p className="text-sm text-muted-foreground">Referral Code</p>
            <p className="text-xl font-bold tracking-wider text-primary">
              {user?.referralCode ?? "---"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Toggle between dark and light mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{isDark ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-sm text-muted-foreground">
                  {isDark ? "Using dark theme" : "Using light theme"}
                </p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-60 mt-2" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

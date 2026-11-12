"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Settings,
  LogOut,
  User,
  Shield,
  LayoutDashboard,
  CheckCheck,
  Trash2,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useThemeStore, useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api/client"
import { timeAgo } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/invest": "Invest",
  "/deposit": "Deposit",
  "/withdraw": "Withdraw",
  "/kyc": "KYC Verification",
  "/settings": "Settings",
  "/admin": "Admin Dashboard",
  "/admin/users": "Users",
  "/admin/kyc": "KYC Requests",
  "/admin/plans": "Investment Plans",
  "/admin/deposits": "Deposits",
  "/admin/withdrawals": "Withdrawals",
  "/admin/settings": "Settings",
  "/admin/email-templates": "Email Templates",
}

export function TopBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isDark, toggle } = useThemeStore()
  const { toggleSidebar } = useAppStore()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const fetchNotifications = async () => {
    const res = await api.get<{ notifications: NotificationItem[] }>("/api/notifications?limit=5")
    if (!res.error && res.data?.notifications) {
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.notifications.filter((n) => !n.read).length)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      intervalRef.current = setInterval(fetchNotifications, 30000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [session])

  const markAllRead = async () => {
    await api.put("/api/notifications", { readAll: true })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await api.delete(`/api/notifications?id=${id}`)
    if (res.error) { toast({ title: "Error", description: res.error, variant: "destructive" }) }
    else {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setUnreadCount((prev) => Math.max(0, prev - (notifications.find((n) => n.id === id)?.read ? 0 : 1)))
    }
  }

  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] || "Dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold font-display">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto text-xs p-0" onClick={markAllRead}>
                  <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50 cursor-pointer",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => deleteNotification(n.id, e)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{session?.user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{session?.user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirect: false }).then(() => window.location.href = "/")} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

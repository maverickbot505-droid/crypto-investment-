"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
    if (status === "authenticated" && adminOnly) {
      const role = (session?.user as any)?.role
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        router.push("/dashboard")
      }
    }
  }, [status, session, router, adminOnly])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") return null
  if (adminOnly) {
    const role = (session?.user as any)?.role
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return null
  }

  return <>{children}</>
}

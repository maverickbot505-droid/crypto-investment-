"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TrendingUp } from "lucide-react"

export function Footer() {
  const pathname = usePathname()

  const isAuthPage = pathname.startsWith("/auth/")
  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invest") ||
    pathname.startsWith("/deposit") ||
    pathname.startsWith("/withdraw") ||
    pathname.startsWith("/kyc") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin")

  if (isAuthPage || isDashboard) return null

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-gradient font-display">InvestPro</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Smart investments for a better future. Grow your wealth with our curated investment plans.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/plans" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Plans
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} InvestPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

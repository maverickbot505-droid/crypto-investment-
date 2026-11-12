"use client"

import { useEffect, type ReactNode } from "react"
import { useThemeStore } from "@/lib/store"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDark = useThemeStore((state) => state.isDark)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  return <>{children}</>
}

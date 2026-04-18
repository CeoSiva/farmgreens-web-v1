"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { analytics } from "@/lib/firebase"
import { logEvent } from "firebase/analytics"
import { initGA4, trackPageView } from "@/lib/analytics"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize GA4
    initGA4()

    // Check if we're on an admin route
    const isAdminRoute = pathname.startsWith("/fmg-admin") || pathname.startsWith("/fmg-login")

    if (isAdminRoute) {
      // Don't track admin routes
      return
    }

    // Track page view with Firebase Analytics
    if (analytics) {
      const districtSlug = searchParams.get("district") || undefined
      logEvent(analytics, "page_view", {
        page_path: pathname,
        page_title: document.title,
        district: districtSlug || "not_set",
      })
    }

    // Track page view with GA4
    trackPageView(pathname, document.title, searchParams.get("district") || undefined)
  }, [pathname, searchParams])

  return <>{children}</>
}

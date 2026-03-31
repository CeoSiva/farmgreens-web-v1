"use client"

import { useRouter } from "next/navigation"
import { useDistrict } from "@/hooks/use-district"

/**
 * A wrapper around next/navigation's useRouter hook that automatically 
 * prepends the active district location slug to imperative navigations (`router.push()`, `router.replace()`).
 * 
 * Ensures buttons that trigger client-side programmatic navigation
 * correctly maintain the user's localized pricing zone.
 */
export function useLocationRouter() {
  const router = useRouter()
  const district = useDistrict()

  const attachLocation = (href: string) => {
    let finalHref = href.toString()
    if (district && finalHref.startsWith("/")) {
      // Prevent double prepending if the developer explicitly provided the slug
      if (!finalHref.startsWith(`/${district}`)) {
        finalHref = `/${district}${finalHref === "/" ? "" : finalHref}`
      }
    }
    return finalHref
  }

  return {
    ...router,
    push: (href: string, options?: any) => router.push(attachLocation(href), options),
    replace: (href: string, options?: any) => router.replace(attachLocation(href), options)
  }
}

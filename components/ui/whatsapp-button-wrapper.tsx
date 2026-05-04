"use client"

import { usePathname } from "next/navigation"
import { WhatsAppButton } from "./whatsapp-button"

const ADMIN_ROUTES = ["/fmg-admin", "/admin", "/login"]

export function WhatsAppButtonWrapper() {
  const pathname = usePathname()

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname?.startsWith(route)
  )

  if (isAdminRoute) {
    return null
  }

  return <WhatsAppButton />
}
"use client"

import { usePathname } from "next/navigation"

// Mirrors the middleware's reserved routing list to safely identify dynamic location slices
const reservedPaths = [
  "fmg-admin", 
  "fmg-login", 
  "api", 
  "assets", 
  "images", 
  "shop", 
  "cart", 
  "checkout", 
  "order-confirmed",
  "about",
  "_next"
]

export function useDistrict() {
  const pathname = usePathname() || ""
  const parts = pathname.split('/').filter(Boolean)
  
  if (parts.length > 0 && !reservedPaths.includes(parts[0])) {
    return parts[0]
  }
  return null
}

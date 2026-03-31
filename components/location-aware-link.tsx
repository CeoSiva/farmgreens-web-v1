"use client"

import Link from "next/link"
import { useDistrict } from "@/hooks/use-district"

/**
 * A seamless wrapper around next/link that automatically prepends the 
 * active district location slug to absolute paths.
 * 
 * If the user is browsing under a customized pricing context (e.g. domain.com/chennai),
 * this ensures all internal links (like href="/shop") correctly route to 
 * domain.com/chennai/shop instead of defaulting back to the root application.
 */
export function LocationAwareLink({ href, children, ...props }: any) {
  const district = useDistrict()
  
  let finalHref = href?.toString() || ""
  
  if (district && finalHref.startsWith("/")) {
    // Prevent double prepending if the developer explicitly provided the slug
    if (!finalHref.startsWith(`/${district}`)) {
      finalHref = `/${district}${finalHref === "/" ? "" : finalHref}`
    }
  }
  
  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  )
}

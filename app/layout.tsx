import { Geist_Mono, Noto_Sans, IBM_Plex_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { CartProvider } from "@/components/cart/cart-context"
import { getCartAction } from "@/server/actions/cart"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"

const ibmPlexSansHeading = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-heading' });

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import { WhatsAppButton } from "@/components/ui/whatsapp-button"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch initial cart for client-side state
  const { cart } = await getCartAction()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", notoSans.variable, ibmPlexSansHeading.variable)}
    >
      <body>
        <AnalyticsProvider>
          <ThemeProvider>
            <CartProvider initialItems={cart.items}>
              {children}
              <WhatsAppButton />
              <Toaster />
            </CartProvider>
          </ThemeProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}

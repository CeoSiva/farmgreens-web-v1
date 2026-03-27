import { Geist_Mono, Noto_Sans, IBM_Plex_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { CartProvider } from "@/components/cart/cart-context"
import { getCartAction } from "@/server/actions/cart"

const ibmPlexSansHeading = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-heading' });

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
        <ThemeProvider>
          <CartProvider initialItems={cart.items}>
            {children}
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

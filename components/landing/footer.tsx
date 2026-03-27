import Link from "next/link"
import { Leaf, CreditCard, Wallet, Banknote, ShieldCheck } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="w-full bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-16 lg:py-16 xl:px-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo & Brand Info Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image
                src="/assets/farm-greens-logo-dark.png"
                alt="Logo"
                width={1862}
                height={413}
                priority
                quality={100}
                className="h-fit w-44"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              Your trusted partner for organic, farm-fresh produce. Delivering
              health and purity straight from the soil to your table since 2026.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide">
              Category
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li>
                <Link
                  href="/shop/vegetables"
                  className="transition-colors hover:text-white"
                >
                  Fresh Vegetables
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/greens"
                  className="transition-colors hover:text-white"
                >
                  Leafy Greens
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/batter"
                  className="transition-colors hover:text-white"
                >
                  Traditional Batter
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/fruits"
                  className="transition-colors hover:text-white"
                >
                  Organic Fruits
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide">
              Company
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/farms"
                  className="transition-colors hover:text-white"
                >
                  Our Farms
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="transition-colors hover:text-white"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide">
              Support
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li>
                <Link
                  href="/faq"
                  className="transition-colors hover:text-white"
                >
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="transition-colors hover:text-white"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="transition-colors hover:text-white"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="transition-colors hover:text-white"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Legal & Payments */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-zinc-800 pt-8 md:mt-16 md:flex-row">
          <div className="flex flex-col items-center gap-4 text-xs text-zinc-500 md:flex-row md:gap-6">
            <span>
              &copy; {new Date().getFullYear()} FarmGreens. All rights
              reserved.
            </span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-zinc-300">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-zinc-300">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-zinc-400 md:mt-0">
            <CreditCard className="h-6 w-6" />
            <Wallet className="h-6 w-6" />
            <Banknote className="h-6 w-6" />
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>
    </footer>
  )
}

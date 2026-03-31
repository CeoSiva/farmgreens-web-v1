"use client"

import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { useRouter } from "next/navigation"
import { Search, Leaf } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Image from "next/image"
import { CartBadge } from "@/components/cart/cart-badge"
import { NavbarSearch } from "@/components/landing/navbar-search"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-20 md:h-16 max-w-7xl items-center px-4 md:h-[72px] md:px-8 lg:px-16 xl:px-24">
        {/* Mobile Menu & Logo */}
        <div className="mr-4 flex items-center gap-2 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/farm-greens-logo-full.png"
              alt="Logo"
              width={1862}
              height={413}
              priority
              quality={100}
              className="h-fit w-44"
            />
          </Link>
        </div>

        {/* Desktop Logo */}
        <div className="mr-8 hidden md:flex">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/farm-greens-logo-full.png"
              alt="logo"
              width={1862}
              height={413}
              priority
              quality={100}
              className="h-fit w-44"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden flex-1 md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[600px] md:grid-cols-[.75fr_1fr] lg:w-[750px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md bg-muted p-6 no-underline outline-none select-none focus:shadow-md group"
                          href="/"
                        >
                          <Image
                            src="/nav-fresh-produce.webp"
                            alt="Fresh Produce"
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="relative z-10">
                            <Leaf className="h-6 w-6 text-primary-foreground mb-2" />
                            <div className="mb-1 text-lg font-medium text-white">
                              Fresh Produce
                            </div>
                            <p className="text-sm leading-tight text-white/80">
                              Organic vegetables and greens straight from the farm.
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li className="group/item">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/shop?category=vegetable"
                          className="flex items-start gap-4 space-y-1 rounded-md p-3 leading-none no-underline transition-all outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 group-hover/item:bg-orange-200 transition-colors">
                            <span className="text-2xl">🥕</span>
                          </div>
                          <div>
                            <div className="text-sm leading-none font-semibold mb-1">
                              Vegetables
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Seasonal and daily fresh veggies.
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li className="group/item">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/shop?category=greens"
                          className="flex items-start gap-4 space-y-1 rounded-md p-3 leading-none no-underline transition-all outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100 group-hover/item:bg-green-200 transition-colors">
                            <span className="text-2xl">🥬</span>
                          </div>
                          <div>
                            <div className="text-sm leading-none font-semibold mb-1">
                              Greens
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Healthy leafy greens and herbs.
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li className="group/item">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/shop?category=batter"
                          className="flex items-start gap-4 space-y-1 rounded-md p-3 leading-none no-underline transition-all outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 group-hover/item:bg-amber-200 transition-colors">
                            <span className="text-2xl">🍚</span>
                          </div>
                          <div>
                            <div className="text-sm leading-none font-semibold mb-1">
                              Batter
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Freshly ground idli/dosa batters.
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/about" className={navigationMenuTriggerStyle()}>
                    About Us
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Actions */}
        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none md:gap-4">
          <NavbarSearch />

          <div className="flex items-center text-muted-foreground">
            <span className="hidden text-border md:inline-block">|</span>
            <CartBadge />
          </div>
        </div>
      </div>
    </header>
  )
}

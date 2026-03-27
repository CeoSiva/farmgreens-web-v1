"use client"

import Link from "next/link"
import { Search, User, ShoppingCart, Leaf } from "lucide-react"

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
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:h-[72px] md:px-8 lg:px-16 xl:px-24">
        {/* Mobile Menu & Logo */}
        <div className="mr-4 flex items-center gap-2 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/farm-greens-logo.png"
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
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none select-none focus:shadow-md"
                          href="/"
                        >
                          <Leaf className="h-6 w-6 text-primary" />
                          <div className="mt-4 mb-2 text-lg font-medium">
                            Fresh Produce
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Organic vegetables and greens straight from the
                            farm.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="/shop/vegetables"
                          className="block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm leading-none font-medium">
                            Vegetables
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Seasonal and daily fresh veggies.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="/shop/greens"
                          className="block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm leading-none font-medium">
                            Greens
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Healthy leafy greens and herbs.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="/shop/batter"
                          className="block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm leading-none font-medium">
                            Batter
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Freshly ground idli/dosa batters.
                          </p>
                        </a>
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
          <div className="relative hidden w-full max-w-[280px] md:block">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-full bg-muted/50 pl-9"
            />
          </div>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <div className="flex items-center text-muted-foreground">
            <span className="hidden text-border md:inline-block">|</span>
            <Button onClick={() => router.push("/cart")} variant="ghost" size="icon" className="text-foreground">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">Cart</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

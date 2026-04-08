"use client"

import { useMemo, useState } from "react"
import { LocationAwareLink as Link } from "@/components/location-aware-link"
import { Search } from "lucide-react"

import {
  ProductCard,
  SerializedProduct,
} from "@/components/landing/product-card"
import { ComboCard, SerializedCombo } from "@/components/combo/ComboCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Category = "all" | "vegetable" | "greens" | "batter"
type Tab = "products" | "combos"

const CATEGORIES: { label: string; value: Category }[] = [
  { label: "All Products", value: "all" },
  { label: "Fresh Greens", value: "greens" },
  { label: "Vegetables", value: "vegetable" },
  { label: "Idli/Dosa Batter", value: "batter" },
]

const TABS: { label: string; value: Tab }[] = [
  { label: "Products", value: "products" },
  { label: "Combo Offers", value: "combos" },
]

export function ShopClient({
  products,
  combos = [],
  districtId = "",
  initialCategory,
  initialSearch = "",
  initialTab = "products",
}: {
  products: SerializedProduct[]
  combos?: SerializedCombo[]
  districtId?: string
  initialCategory: string
  initialSearch?: string
  initialTab?: string
}) {
  const normalizedInitial = ((): Category => {
    if (initialCategory === "vegetable") return "vegetable"
    if (initialCategory === "greens") return "greens"
    if (initialCategory === "batter") return "batter"
    return "all"
  })()

  const normalizedTab = ((): Tab => {
    if (initialTab === "combos") return "combos"
    return "products"
  })()

  const [tab, setTab] = useState<Tab>(normalizedTab)
  const [category, setCategory] = useState<Category>(normalizedInitial)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = category === "all" || p.category === category
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
            false)

        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        // 1. Availability first
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1
        }
        // 2. Then Price (Ascending)
        return a.price - b.price
      })
  }, [category, searchQuery, products])

  return (
    <section className="w-full bg-background/50 px-4 py-8 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Shop <span className="text-primary">Fresh</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground md:text-base">
              Farm-to-table greens and organic vegetables, delivered straight to
              your doorstep within hours of harvest.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full pl-9 focus-visible:ring-primary"
              />
            </div>

            {/* Tabs */}
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {TABS.map((t) => (
                <Button
                  key={t.value}
                  variant={tab === t.value ? "default" : "outline"}
                  className={cn(
                    "h-auto rounded-full px-5 py-2 text-xs font-bold whitespace-nowrap transition-all",
                    tab === t.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "border-primary/20 bg-background hover:border-primary/40 hover:bg-primary/5"
                  )}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                  {t.value === "combos" && combos.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                      {combos.length}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pills - Only show on products tab */}
        {tab === "products" && (
          <div className="mb-6 no-scrollbar flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "outline"}
                className={cn(
                  "h-auto rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                  category === c.value
                    ? "bg-primary/90 text-primary-foreground"
                    : "border-primary/20 bg-background/50 hover:bg-primary/5"
                )}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        )}

        {/* Content */}
        {tab === "combos" ? (
          /* Combos Tab */
          combos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-16 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No combo offers available
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon for exciting bundle deals!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {combos.map((combo) => (
                <ComboCard
                  key={combo._id}
                  combo={combo}
                  districtId={districtId}
                />
              ))}
            </div>
          )
        ) : /* Products Tab */
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-16 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              No matches found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

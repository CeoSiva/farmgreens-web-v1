"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import { ProductCard, SerializedProduct } from "@/components/landing/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Category = "all" | "vegetable" | "greens" | "batter"

const CATEGORIES: { label: string; value: Category }[] = [
  { label: "All Products", value: "all" },
  { label: "Vegetables", value: "vegetable" },
  { label: "Fresh Greens", value: "greens" },
  { label: "Idli/Dosa Batter", value: "batter" },
]

export function ShopClient({
  products,
  initialCategory,
  initialSearch = "",
}: {
  products: SerializedProduct[]
  initialCategory: string
  initialSearch?: string
}) {
  const normalizedInitial = ((): Category => {
    if (initialCategory === "vegetable") return "vegetable"
    if (initialCategory === "greens") return "greens"
    if (initialCategory === "batter") return "batter"
    return "all"
  })()

  const [category, setCategory] = useState<Category>(normalizedInitial)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === "all" || p.category === category
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      return matchesCategory && matchesSearch
    })
  }, [category, searchQuery, products])

  return (
    <section className="w-full px-4 py-10 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Shop</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse our fresh collection and eat healthy today.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full pl-9 focus-visible:ring-primary"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {CATEGORIES.map((c) => (
                <Button
                  key={c.value}
                  variant={category === c.value ? "default" : "outline"}
                  className="rounded-full transition-all"
                  onClick={() => setCategory(c.value)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-12 text-muted-foreground">
            No products available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

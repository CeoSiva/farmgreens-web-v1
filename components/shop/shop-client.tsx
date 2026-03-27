"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { ProductCard, SerializedProduct } from "@/components/landing/product-card"
import { Button } from "@/components/ui/button"

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
}: {
  products: SerializedProduct[]
  initialCategory: string
}) {
  const normalizedInitial = ((): Category => {
    if (initialCategory === "vegetable") return "vegetable"
    if (initialCategory === "greens") return "greens"
    if (initialCategory === "batter") return "batter"
    return "all"
  })()

  const [category, setCategory] = useState<Category>(normalizedInitial)

  const filtered = useMemo(() => {
    if (category === "all") return products
    return products.filter((p) => p.category === category)
  }, [category, products])

  return (
    <section className="w-full px-4 py-10 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
            <p className="text-sm text-muted-foreground">
              Browse fresh products and order in minutes.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}

            <Button variant="ghost" asChild className="rounded-full">
              <Link href="/cart">Cart</Link>
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-12 text-muted-foreground">
            No products available.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

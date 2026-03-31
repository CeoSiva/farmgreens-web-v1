"use client"

import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { useLocationRouter } from "@/hooks/use-location-router"
import { cn } from "@/lib/utils"

export function CategoryChips() {
  const router = useLocationRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category") || "All Products"

const categories = [
    { label: "All Products", value: "All Products" },
    { label: "Vegetables", value: "vegetable" },
    { label: "Fresh Greens", value: "greens" },
    { label: "Idli/Dosa Batter", value: "batter" },
  ]

  const handleCategoryClick = (categoryValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryValue === "All Products") {
      params.delete("category")
    } else {
      params.set("category", categoryValue)
    }
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-4 pt-12 no-scrollbar md:flex-wrap md:overflow-visible">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "outline"}
            onClick={() => handleCategoryClick(cat.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-5 py-1.5 text-sm font-medium transition-all text-sm",
              activeCategory === cat.value 
                ? "shadow-md" 
                : "text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {cat.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

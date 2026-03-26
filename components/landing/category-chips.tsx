import { Button } from "@/components/ui/button"

export function CategoryChips() {
  const categories = [
    { name: "All Products", active: true },
    { name: "Vegetables", active: false },
    { name: "Fresh Greens", active: false },
    { name: "Idli/Dosa Batter", active: false },
    { name: "Organic Fruits", active: false },
  ]

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 xl:px-24">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-4 pt-12 no-scrollbar md:flex-wrap md:overflow-visible">
        {categories.map((cat) => (
          <Button
            key={cat.name}
            variant={cat.active ? "default" : "outline"}
            className={`whitespace-nowrap rounded-full px-5 py-1.5 text-sm font-medium ${
              cat.active ? "" : "text-muted-foreground border-border"
            }`}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

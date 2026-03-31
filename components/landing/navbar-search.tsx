"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { useLocationRouter } from "@/hooks/use-location-router"
import Image from "next/image"

import { Input } from "@/components/ui/input"
import { searchProductsAction } from "@/server/actions/product"
import { SerializedProduct } from "@/components/landing/product-card"

export function NavbarSearch() {
  const router = useLocationRouter()
  const [query, setQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<SerializedProduct[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true)
        const res = await searchProductsAction(query)
        if (res.success && res.matches) {
          setSuggestions(res.matches)
          setIsOpen(true)
        }
        setIsLoading(false)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: SerializedProduct) => {
    setQuery(suggestion.name)
    setIsOpen(false)
    router.push(`/shop?search=${encodeURIComponent(suggestion.name)}`)
  }

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-[280px] md:block z-50">
      <form onSubmit={handleSearch}>
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          type="search"
          placeholder="Search products..."
          className="w-full rounded-full bg-muted/50 pl-9"
          autoComplete="off"
        />
      </form>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {isLoading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col py-2">
              {suggestions.map((item) => (
                <button
                  key={item._id}
                  onClick={() => handleSuggestionClick(item)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">₹{item.price} • {item.orderQuantity?.unit || "unit"}</span>
                  </div>
                </button>
              ))}
              <div 
                className="px-4 py-2 mt-1 border-t text-xs text-center font-medium text-primary hover:text-primary/80 cursor-pointer hidden" 
              >
              </div>
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">No matches found.</div>
          ) : null}
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { Search, X, ArrowLeft } from "lucide-react"
import { useLocationRouter } from "@/hooks/use-location-router"
import { useDistrict } from "@/hooks/use-district"
import Image from "next/image"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchProductsAction } from "@/server/actions/product"
import { SerializedProduct } from "@/components/landing/product-card"
import { cn } from "@/lib/utils"

export function NavbarSearch() {
  const router = useLocationRouter()
  const district = useDistrict()
  
  const [query, setQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<SerializedProduct[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mobileInputRef = React.useRef<HTMLInputElement>(null)

  // Close suggestions on click outside (Desktop)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus mobile input when opened
  React.useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isMobileSearchOpen])

  // Fetch suggestions with debounce
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true)
        const res = await searchProductsAction(query, district || undefined)
        if (res.success && res.matches) {
          setSuggestions(res.matches)
          setIsOpen(true)
          setActiveIndex(-1)
        }
        setIsLoading(false)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, district])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      setIsMobileSearchOpen(false)
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: SerializedProduct) => {
    setQuery(suggestion.name)
    setIsOpen(false)
    setIsMobileSearchOpen(false)
    router.push(`/shop?search=${encodeURIComponent(suggestion.name)}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > -1 ? prev - 1 : prev))
    } else if (e.key === "Enter") {
      if (activeIndex > -1 && suggestions[activeIndex]) {
        e.preventDefault()
        handleSuggestionClick(suggestions[activeIndex])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setIsMobileSearchOpen(false)
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-primary font-bold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  return (
    <>
      {/* Search Toggle for Mobile */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden text-muted-foreground"
        onClick={() => setIsMobileSearchOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>

      {/* Desktop Search Bar */}
      <div ref={containerRef} className="relative hidden md:block w-full max-w-[280px] z-50">
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true)
            }}
            onKeyDown={onKeyDown}
            type="search"
            placeholder="Search products..."
            className="w-full rounded-full bg-muted/50 pl-9 pr-9 focus-visible:ring-primary focus-visible:bg-background transition-all"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </form>

        {/* Desktop Suggestions Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-50">
            {isLoading ? (
              <div className="px-6 py-8 flex flex-col items-center gap-3">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-muted-foreground">Searching results...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-col">
                <div className="px-4 py-2 bg-muted/30 border-b">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Results</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto py-1">
                  {suggestions.map((item, index) => (
                    <button
                      key={item._id}
                      onClick={() => handleSuggestionClick(item)}
                      className={cn(
                        "group flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all hover:bg-primary/5",
                        activeIndex === index && "bg-primary/10 border-l-2 border-primary"
                      )}
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {highlightMatch(item.name, query)}
                        </span>
                        <div className="flex items-center gap-1.5">
                             <span className="text-xs font-medium text-primary">₹{(item.price * (item.orderQuantity?.unit?.toLowerCase() === "kg" ? 0.25 : 1)).toFixed(0)}</span>
                             <span className="text-[10px] text-muted-foreground">•</span>
                             <span className="text-[10px] uppercase font-bold text-muted-foreground">
                               {item.orderQuantity?.unit?.toLowerCase() === "kg" ? "250g" : (item.orderQuantity?.unit || "unit")}
                             </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleSearch()}
                  className="w-full py-3 bg-muted/50 hover:bg-primary/5 text-center transition-colors border-t group text-xs font-bold text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
                >
                  View all for &quot;{query}&quot;
                  <Search className="h-3 w-3" />
                </button>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-10 text-center">
                 <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                 <p className="text-sm font-medium text-foreground">No matches found</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-background animate-in fade-in slide-in-from-bottom duration-300 md:hidden flex flex-col">
          <div className="flex items-center gap-3 px-4 h-16 border-b shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <form onSubmit={handleSearch} className="flex-1">
              <Input
                ref={mobileInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search fresh products..."
                className="w-full border-none shadow-none text-base focus-visible:ring-0 px-0"
                autoComplete="off"
              />
            </form>
            {query && (
              <Button variant="ghost" size="icon" onClick={() => setQuery("")}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/20">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-muted-foreground">Finding the best produce...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="bg-background">
                <div className="px-4 py-2 bg-muted/30 border-b">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggestions</span>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSuggestionClick(item)}
                    className="flex items-center gap-4 w-full px-4 py-4 border-b text-left active:bg-muted transition-colors"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
                      <Image
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-base font-bold text-foreground">
                        {highlightMatch(item.name, query)}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-sm font-bold text-primary">₹{(item.price * (item.orderQuantity?.unit?.toLowerCase() === "kg" ? 0.25 : 1)).toFixed(0)}</span>
                         <span className="text-xs text-muted-foreground">
                           for {item.orderQuantity?.unit?.toLowerCase() === "kg" ? "250g" : (item.orderQuantity?.unit || "unit")}
                         </span>
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => handleSearch()}
                  className="w-full py-5 bg-primary/5 text-center text-primary font-bold text-sm"
                >
                  See all results for &quot;{query}&quot;
                </button>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="flex flex-col items-center py-20 px-10 text-center">
                 <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                 </div>
                 <p className="text-lg font-bold text-foreground">No matches found</p>
                 <p className="text-sm text-muted-foreground mt-2">Try a different keyword like &quot;Greens&quot; or &quot;Vegetables&quot;</p>
              </div>
            ) : (
                <div className="p-10 text-center">
                   <p className="text-xs font-medium text-muted-foreground">Type at least 2 characters to see suggestions</p>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

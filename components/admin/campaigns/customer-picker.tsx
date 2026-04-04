"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  _id: string
  name: string
  mobile: string
  whatsappOptIn: boolean
}

interface Props {
  selected: Customer[]
  onChange: (customers: Customer[]) => void
}

export function CustomerPicker({ selected, onChange }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(q)}&optedOnly=true`)
      const data = await res.json()
      setResults(data.customers ?? [])
    } catch {
      toast.error("Search failed")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    search(e.target.value)
  }

  const toggle = (customer: Customer) => {
    const isSelected = selected.some((c) => c._id === customer._id)
    if (isSelected) {
      onChange(selected.filter((c) => c._id !== customer._id))
    } else {
      onChange([...selected, customer])
    }
  }

  const remove = (id: string) => onChange(selected.filter((c) => c._id !== id))

  return (
    <div className="space-y-3">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <Badge key={c._id} variant="secondary" className="gap-1 text-xs">
              {c.name} ({c.mobile})
              <button onClick={() => remove(c._id)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInput}
          placeholder="Search by name or phone..."
          className="pl-8"
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="border rounded-lg divide-y max-h-56 overflow-y-auto bg-background shadow-sm">
          {results.map((c) => {
            const isSelected = selected.some((s) => s._id === c._id)
            return (
              <button
                key={c._id}
                onClick={() => toggle(c)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                  isSelected ? "bg-green-50 dark:bg-green-950" : ""
                }`}
              >
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-2">{c.mobile}</span>
                </span>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}

      {loading && <p className="text-xs text-muted-foreground">Searching...</p>}
      {query && !loading && results.length === 0 && (
        <p className="text-xs text-muted-foreground">No opted-in customers found.</p>
      )}

      <p className="text-xs text-muted-foreground">
        {selected.length} customer{selected.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  )
}

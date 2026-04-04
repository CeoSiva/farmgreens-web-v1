"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Search, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface GupshupTemplate {
  id: string
  name: string
  category: string
  status: string
  body: string
  language: string
  params: string[]
}

interface Props {
  onSelect: (template: GupshupTemplate) => void
}

export function TemplateBrowser({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<GupshupTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [errorHint, setErrorHint] = useState("")

  const fetchTemplates = async () => {
    if (templates.length > 0) { setOpen(true); return }
    setLoading(true)
    setErrorHint("")
    try {
      const res = await fetch("/api/admin/gupshup/templates")
      const data = await res.json()
      if (!res.ok) {
        if (data.hint) setErrorHint(data.hint)
        throw new Error(data.error)
      }
      setTemplates(data.templates ?? [])
      setOpen(true)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <BookOpen className="mr-2 h-4 w-4" />
        )}
        Browse Gupshup Templates
      </Button>

      {errorHint && !open && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-semibold">⚙️ Setup required to browse templates:</p>
          <p>{errorHint}</p>
          <a
            href="https://app.gupshup.io"
            target="_blank"
            rel="noreferrer"
            className="underline font-medium"
          >
            Open Gupshup Dashboard →
          </a>
        </div>
      )}

      {open && (
        <Card className="mt-3 border shadow-md">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Select a Template</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>✕</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No templates found.
                </p>
              ) : (
                filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onSelect(t); setOpen(false) }}
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.name}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">{t.category}</Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${t.status === "APPROVED" ? "text-green-600 border-green-300" : "text-yellow-600 border-yellow-300"}`}
                        >
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                    <p className="text-xs text-blue-600">ID: {t.id}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

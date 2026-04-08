import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Search, CheckCircle2, Loader2, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface GupshupTemplate {
  id: string
  name: string
  category: string
  status: string
  body: string
  language: string
  params: string[]
  templateType?: string
  hasMediaHeader?: boolean
  mediaUrl?: string
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
  const [activeCategory, setActiveCategory] = useState<string>("ALL")

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

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category))
    return ["ALL", ...Array.from(cats)].sort()
  }, [templates])

  const filtered = templates.filter(
    (t) =>
      (activeCategory === "ALL" || t.category === activeCategory) &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
       t.body?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={fetchTemplates} disabled={loading} className="gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BookOpen className="h-4 w-4" />
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
        <Card className="mt-4 border shadow-lg bg-card/60 backdrop-blur-md overflow-hidden">
          <div className="bg-muted px-4 py-3 flex items-center justify-between border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Select Gupshup Template
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>✕</Button>
          </div>
          <CardContent className="p-0">
            <Tabs defaultValue="ALL" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <div className="p-4 border-b space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates by name or content..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <TabsList className="w-full flex-wrap h-auto justify-start gap-1 bg-transparent p-0">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted"
                    >
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto bg-muted/20">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <p>No templates found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((t) => (
                      <div
                        key={t.id}
                        className="group relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => { onSelect(t); setOpen(false) }}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {t.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {t.status === "APPROVED" ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                                  {t.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-foreground/80 line-clamp-3 bg-muted/40 p-2 rounded-md font-sans">
                            {t.body}
                          </p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                            <span>ID: <code className="bg-muted px-1 py-0.5 rounded">{t.id.slice(0,8)}...</code></span>
                            <span className="flex items-center gap-1">
                              Tap to select <CheckCircle2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

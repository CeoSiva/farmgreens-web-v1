"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TemplateBrowser } from "@/components/admin/campaigns/template-browser"
import { CustomerPicker } from "@/components/admin/campaigns/customer-picker"
import { toast } from "sonner"
import {
  ArrowLeft, ArrowRight, Send, Clock, Users, Megaphone, Info, ChevronDown, ChevronUp,
} from "lucide-react"

type FilterType = "all" | "new_customers" | "high_value" | "city" | "manual"

interface Customer { _id: string; name: string; mobile: string; whatsappOptIn: boolean }

const DYNAMIC_VARS = [
  { key: "{{customerName}}", label: "Customer Name", example: "Ravi Kumar" },
]

export default function CreateCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null)
  const [showVarGuide, setShowVarGuide] = useState(false)

  // Step 1 state
  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateBody, setTemplateBody] = useState("")
  const [params, setParams] = useState(["", "", "", "", ""])

  // Step 2 state
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [minSpend, setMinSpend] = useState("")
  const [city, setCity] = useState("")
  const [daysSinceJoined, setDaysSinceJoined] = useState("30")
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])

  // Step 3 state
  const [sendTiming, setSendTiming] = useState<"now" | "later">("now")
  const [scheduledAt, setScheduledAt] = useState("")

  const updateParam = (i: number, val: string) => {
    const updated = [...params]
    updated[i] = val
    setParams(updated)
  }

  /** Replace all {{n}} placeholders in the template body with the entered param values */
  const previewMessage = () => {
    if (!templateBody && !params[0]) return "(Select a template to see preview)"
    let preview = templateBody || `Hi {{1}},\n\n${params.slice(1).filter(Boolean).join("\n")}`
    params.forEach((p, i) => {
      if (p) preview = preview.replaceAll(`{{${i + 1}}}`, p)
    })
    return preview
  }

  const buildFilter = () => ({
    type: filterType,
    ...(filterType === "high_value" && { minSpend: Number(minSpend) }),
    ...(filterType === "city" && { city }),
    ...(filterType === "new_customers" && { daysSinceJoined: Number(daysSinceJoined) }),
    ...(filterType === "manual" && { customerIds: selectedCustomers.map((c) => c._id) }),
  })

  const calculateReach = async () => {
    if (filterType === "manual") {
      setEstimatedReach(selectedCustomers.length)
      return
    }
    setEstimating(true)
    try {
      const f = buildFilter()
      const qs = new URLSearchParams({ filterType: f.type })
      if (f.minSpend != null) qs.set("minSpend", String(f.minSpend))
      if (f.city) qs.set("city", f.city)
      if (f.daysSinceJoined != null) qs.set("daysSinceJoined", String(f.daysSinceJoined))

      const res = await fetch(`/api/admin/campaigns/estimate?${qs}`)
      const data = await res.json()
      setEstimatedReach(data.count)
    } catch {
      toast.error("Failed to estimate reach")
    } finally {
      setEstimating(false)
    }
  }

  const handleSubmit = async (asDraft = false) => {
    if (!name || !templateId) {
      toast.error("Campaign name and Template ID are required")
      return
    }
    if (filterType === "manual" && selectedCustomers.length === 0) {
      toast.error("Please select at least one customer")
      return
    }
    setLoading(true)
    try {
      const body = {
        name,
        templateId,
        templateName: templateName || name,
        templateParams: params.filter(Boolean),
        targetFilter: buildFilter(),
        ...(sendTiming === "later" && scheduledAt && { scheduledAt }),
      }
      const res = await fetch("/api/admin/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (!asDraft && sendTiming === "now") {
        await fetch(`/api/admin/campaigns/${data.campaign._id}/send`, { method: "POST" })
      }
      toast.success(asDraft ? "Saved as draft" : "Campaign created and started!")
      router.push("/fmg-admin/campaigns")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create campaign")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/fmg-admin/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-green-600" />
            Create Campaign
          </h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-2">
        {[
          { n: 1, label: "Template" },
          { n: 2, label: "Audience" },
          { n: 3, label: "Schedule" },
        ].map((s) => (
          <div key={s.n} className="flex-1 flex flex-col gap-1">
            <div className={`h-1.5 rounded-full transition-colors ${s.n <= step ? "bg-green-500" : "bg-muted"}`} />
            <span className={`text-xs ${s.n === step ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ───────── STEP 1: Template & Content ───────── */}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Holi Offer 2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Template ID (Gupshup UUID) *</Label>
                  <Input
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Template Name (reference)</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. holi_offer_2026"
                  />
                </div>

                {/* Browse button */}
                <TemplateBrowser
                  onSelect={(t) => {
                    setTemplateId(t.id)
                    setTemplateName(t.name)
                    setTemplateBody(t.body ?? "")
                    // Auto-fill param count
                    setParams(
                      Array.from({ length: 5 }, (_, i) => (i < t.params.length ? params[i] ?? "" : ""))
                    )
                    toast.success(`Template "${t.name}" selected`)
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Template Variables</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowVarGuide(!showVarGuide)}
                  >
                    <Info className="h-3 w-3" />
                    Dynamic Data Guide
                    {showVarGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dynamic variable guide */}
                {showVarGuide && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Available Dynamic Variables — type these into any parameter field:
                    </p>
                    {DYNAMIC_VARS.map((v) => (
                      <div key={v.key} className="flex items-center gap-2 text-xs">
                        <code className="bg-white dark:bg-blue-900 border border-blue-200 dark:border-blue-700 px-1.5 py-0.5 rounded font-mono text-blue-700 dark:text-blue-300 select-all">
                          {v.key}
                        </code>
                        <span className="text-muted-foreground">
                          → {v.label} (e.g. &ldquo;<em>{v.example}</em>&rdquo;)
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1">
                      These will be replaced with each customer&apos;s actual data when the campaign is sent.
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Enter values for each <code className="bg-muted px-1 rounded">{"{{n}}"}</code> placeholder in your template. Use{" "}
                  <code className="bg-muted px-1 rounded">{"{{customerName}}"}</code> to personalize.
                </p>

                <div className="space-y-2">
                  {params.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs w-12 shrink-0 justify-center">
                        {"{{" + (i + 1) + "}}"}
                      </Badge>
                      <Input
                        value={p}
                        onChange={(e) => updateParam(i, e.target.value)}
                        placeholder={i === 0 ? "{{customerName}} or fixed text" : "Value or leave blank"}
                        className="flex-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-3">
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle>Live Preview</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Showing how the message will look with your entered values
                </p>
              </CardHeader>
              <CardContent>
                {/* WhatsApp-style bubble */}
                <div className="bg-[#E5DDD5] dark:bg-[#1C1C1E] rounded-xl p-3 min-h-[240px]">
                  <div className="bg-white dark:bg-[#2C2C2E] rounded-xl rounded-tl-none px-3 py-2.5 shadow-sm max-w-[90%] inline-block">
                    <div className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-gray-800 dark:text-gray-200 min-h-[100px]">
                      {previewMessage()}
                    </div>
                    <div className="text-[10px] text-right text-muted-foreground mt-1.5">
                      {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ✓✓
                    </div>
                  </div>
                </div>

                {templateId && (
                  <div className="mt-3 rounded-lg bg-muted p-2 text-xs space-y-0.5">
                    <p>
                      <span className="text-muted-foreground">Template ID:</span>{" "}
                      <code className="font-mono">{templateId}</code>
                    </p>
                    {templateName && (
                      <p>
                        <span className="text-muted-foreground">Name:</span> {templateName}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ───────── STEP 2: Target Audience ───────── */}
      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <RadioGroup
                value={filterType}
                onValueChange={(v: FilterType) => {
                  setFilterType(v)
                  setEstimatedReach(null)
                }}
              >
                {[
                  { value: "all", label: "All opted-in customers", desc: "Everyone who agreed to receive WhatsApp messages" },
                  { value: "new_customers", label: "New customers", desc: "Customers who joined within N days" },
                  { value: "high_value", label: "High-value customers", desc: "Customers with total order spend above a threshold" },
                  { value: "city", label: "Specific city / district", desc: "Filter by district name from the database" },
                  { value: "manual", label: "Manually selected customers", desc: "Search and pick individual customers" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-start space-x-2.5">
                    <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
                    <Label htmlFor={opt.value} className="cursor-pointer">
                      <span className="font-medium">{opt.label}</span>
                      <p className="text-xs text-muted-foreground font-normal">{opt.desc}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Conditional sub-fields */}
              <div className="pl-1">
                {filterType === "new_customers" && (
                  <div className="space-y-1.5">
                    <Label>Joined in the last (days)</Label>
                    <Input
                      type="number"
                      value={daysSinceJoined}
                      onChange={(e) => setDaysSinceJoined(e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
                {filterType === "high_value" && (
                  <div className="space-y-1.5">
                    <Label>Minimum total spend (₹)</Label>
                    <Input
                      type="number"
                      value={minSpend}
                      onChange={(e) => setMinSpend(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-40"
                    />
                  </div>
                )}
                {filterType === "city" && (
                  <div className="space-y-1.5">
                    <Label>District / City name</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-56"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must exactly match a district name in the database.
                    </p>
                  </div>
                )}
                {filterType === "manual" && (
                  <CustomerPicker
                    selected={selectedCustomers}
                    onChange={setSelectedCustomers}
                  />
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={calculateReach}
                  disabled={estimating || (filterType === "city" && !city) || (filterType === "high_value" && !minSpend)}
                >
                  {estimating ? "Calculating..." : "Calculate Reach"}
                </Button>
                {estimatedReach !== null && (
                  <p className="text-sm font-medium text-green-600">
                    ~<strong>{estimatedReach.toLocaleString()}</strong> customers
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audience Summary Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Audience Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filter type</span>
                <Badge variant="outline" className="capitalize">{filterType.replace("_", " ")}</Badge>
              </div>
              {filterType === "new_customers" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined within</span>
                  <span>{daysSinceJoined} days</span>
                </div>
              )}
              {filterType === "high_value" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min spend</span>
                  <span>₹{minSpend || "—"}</span>
                </div>
              )}
              {filterType === "city" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City</span>
                  <span>{city || "—"}</span>
                </div>
              )}
              {filterType === "manual" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected</span>
                  <span>{selectedCustomers.length} customers</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated reach</span>
                <span className="font-semibold">
                  {estimatedReach !== null ? `~${estimatedReach.toLocaleString()}` : "Not calculated"}
                </span>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-2.5 text-xs text-yellow-800 dark:text-yellow-200">
                Only customers with WhatsApp opt-in enabled will receive messages, regardless of filter.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ───────── STEP 3: Schedule & Review ───────── */}
      {step === 3 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <RadioGroup
                value={sendTiming}
                onValueChange={(v: "now" | "later") => setSendTiming(v)}
              >
                <div className="flex items-start space-x-2.5">
                  <RadioGroupItem value="now" id="now" className="mt-1" />
                  <Label htmlFor="now" className="cursor-pointer">
                    <span className="font-medium">Send immediately</span>
                    <p className="text-xs text-muted-foreground font-normal">Campaign starts as soon as you confirm</p>
                  </Label>
                </div>
                <div className="flex items-start space-x-2.5">
                  <RadioGroupItem value="later" id="later" className="mt-1" />
                  <Label htmlFor="later" className="cursor-pointer">
                    <span className="font-medium">Schedule for later</span>
                    <p className="text-xs text-muted-foreground font-normal">Automatically triggered by cron job</p>
                  </Label>
                </div>
              </RadioGroup>

              {sendTiming === "later" && (
                <div className="space-y-1.5 pl-1">
                  <Label>Scheduled date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-64"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full campaign summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Campaign name", value: name || "—" },
                { label: "Template ID", value: templateId ? <code className="text-xs font-mono">{templateId.slice(0, 20)}...</code> : "—" },
                { label: "Template name", value: templateName || "—" },
                { label: "Audience", value: filterType.replace("_", " ") },
                { label: "Est. reach", value: estimatedReach != null ? `~${estimatedReach.toLocaleString()} customers` : "Not estimated" },
                { label: "Timing", value: sendTiming === "now" ? "Immediately after confirm" : scheduledAt || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 justify-end pt-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!name || !templateId)}
          >
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => handleSubmit(true)} disabled={loading}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={loading}>
              <Send className="mr-2 h-4 w-4" />
              {sendTiming === "later" ? "Confirm & Schedule" : "Confirm & Send"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

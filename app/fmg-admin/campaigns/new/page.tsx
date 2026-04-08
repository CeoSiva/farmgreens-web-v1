"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TemplateBrowser } from "@/components/admin/campaigns/template-browser"
import { CustomerPicker } from "@/components/admin/campaigns/customer-picker"
import { toast } from "sonner"
import {
  ArrowLeft, ArrowRight, Send, Clock, Users, Megaphone, Info, ChevronDown, ChevronUp,
} from "lucide-react"

interface Customer { _id: string; name: string; mobile: string; whatsappOptIn: boolean }
interface DistrictOption { _id: string; name: string }

const DYNAMIC_VARS = [
  { key: "{{customerName}}", label: "Customer Full Name", example: "Ravi Kumar" },
  { key: "{{customerFirstName}}", label: "Customer First Name", example: "Ravi" },
  { key: "{{customerMobile}}", label: "Customer Mobile", example: "9876543210" },
]

export default function CreateCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null)
  const [showVarGuide, setShowVarGuide] = useState(false)
  const [isEstimateStale, setIsEstimateStale] = useState(false)
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([])
  const [loadingDistricts, setLoadingDistricts] = useState(false)

  // Step 1 state
  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateBody, setTemplateBody] = useState("")
  const [templateStatus, setTemplateStatus] = useState("")
  const [templateLanguage, setTemplateLanguage] = useState("")
  const [params, setParams] = useState(["", "", "", "", ""])
  const [hasMediaHeader, setHasMediaHeader] = useState(false)
  const [templateMediaUrl, setTemplateMediaUrl] = useState("")

  // Step 2 state
  const [useAllOptedIn, setUseAllOptedIn] = useState(true)
  const [useManual, setUseManual] = useState(false)
  const [useCityFilter, setUseCityFilter] = useState(false)
  const [selectedCity, setSelectedCity] = useState("")
  const [useMinSpendFilter, setUseMinSpendFilter] = useState(false)
  const [minSpend, setMinSpend] = useState("")
  const [useNewCustomerFilter, setUseNewCustomerFilter] = useState(false)
  const [daysSinceJoined, setDaysSinceJoined] = useState("30")
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])

  // Step 3 state
  const [sendTiming, setSendTiming] = useState<"now" | "later">("now")
  const [scheduledAt, setScheduledAt] = useState("")

  const requiredPlaceholderIndexes = Array.from(
    new Set(
      (templateBody.match(/\{\{(\d+)\}\}/g) ?? [])
        .map((m) => Number(m.replace(/\D/g, "")))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  ).sort((a, b) => a - b)

  const missingPlaceholderIndexes = requiredPlaceholderIndexes.filter(
    (index) => !params[index - 1]?.trim()
  )


  const step1Issues: string[] = []
  if (!name.trim()) step1Issues.push("Campaign name is required.")
  if (!templateId.trim()) step1Issues.push("Template ID is required.")
  if (requiredPlaceholderIndexes.length > 0 && !params.some((p) => p.trim().length > 0)) {
    step1Issues.push("Add at least one template parameter or dynamic variable.")
  }
  if (missingPlaceholderIndexes.length > 0) {
    step1Issues.push(`Missing values for placeholders: ${missingPlaceholderIndexes.map((i) => `{{${i}}}`).join(", ")}`)
  }

  const step2Issues: string[] = []
  if (useManual && selectedCustomers.length === 0) {
    step2Issues.push("Select at least one customer for manual targeting.")
  }
  if (useCityFilter && !selectedCity.trim()) {
    step2Issues.push("District / city name is required for city targeting.")
  }
  if (useMinSpendFilter && !minSpend.trim()) {
    step2Issues.push("Minimum spend is required for high-value targeting.")
  }
  if (!useAllOptedIn && !useManual && !useCityFilter && !useMinSpendFilter && !useNewCustomerFilter) {
    step2Issues.push("Select at least one target audience filter, or choose 'All opted-in'.")
  }

  const step3Issues: string[] = []
  if (sendTiming === "later" && !scheduledAt) {
    step3Issues.push("Scheduled date and time is required when sending later.")
  }
  if (sendTiming === "later" && scheduledAt) {
    const scheduleDate = new Date(scheduledAt)
    if (Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() <= Date.now()) {
      step3Issues.push("Scheduled date and time must be in the future.")
    }
  }
  if (!useManual && isEstimateStale) {
    step3Issues.push("Audience estimate is stale. Recalculate reach before confirming.")
  }

  const updateParam = (i: number, val: string) => {
    const updated = [...params]
    updated[i] = val
    setParams(updated)
  }

  const markEstimateStale = () => {
    if (estimatedReach !== null) {
      setIsEstimateStale(true)
    }
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

  const unresolvedNumericPlaceholders = Array.from(
    new Set((previewMessage().match(/\{\{\d+\}\}/g) ?? []))
  )

  const buildFilter = () => {
    if (useManual) return { type: "manual", customerIds: selectedCustomers.map((c) => c._id) }
    if (useAllOptedIn) return { type: "combined" }
    return {
      type: "combined",
      ...(useMinSpendFilter && minSpend && { minSpend: Number(minSpend) }),
      ...(useCityFilter && selectedCity && { districts: [selectedCity] }),
      ...(useNewCustomerFilter && daysSinceJoined && { daysSinceJoined: Number(daysSinceJoined) }),
    }
  }

  const calculateReach = async () => {
    if (useManual) {
      setEstimatedReach(selectedCustomers.length)
      setIsEstimateStale(false)
      return
    }
    setEstimating(true)
    try {
      const f: any = buildFilter()
      const qs = new URLSearchParams()
      qs.set("filterType", f.type)
      if (f.minSpend != null) qs.set("minSpend", String(f.minSpend))
      if (f.districts?.length > 0) qs.set("city", f.districts.join(","))
      if (f.daysSinceJoined != null) qs.set("daysSinceJoined", String(f.daysSinceJoined))

      const res = await fetch(`/api/admin/campaigns/estimate?${qs}`)
      const data = await res.json()
      setEstimatedReach(data.count)
      setIsEstimateStale(false)
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
    if (useManual && selectedCustomers.length === 0) {
      toast.error("Please select at least one customer")
      return
    }
    if (missingPlaceholderIndexes.length > 0) {
      toast.error(`Fill required placeholders: ${missingPlaceholderIndexes.map((i) => `{{${i}}}`).join(", ")}`)
      return
    }
    if (!asDraft && !useManual && isEstimateStale) {
      toast.error("Recalculate audience estimate before confirming send/schedule")
      return
    }
    if (sendTiming === "later") {
      const scheduleDate = new Date(scheduledAt)
      if (!scheduledAt || Number.isNaN(scheduleDate.getTime()) || scheduleDate.getTime() <= Date.now()) {
        toast.error("Please select a future date/time for scheduled campaign")
        return
      }
    }

    if (!asDraft && sendTiming === "now") {
      const confirmed = window.confirm(
        `Send campaign now?\n\nCampaign: ${name}\nTemplate: ${templateName || templateId}\nEstimated Reach: ${
          estimatedReach !== null ? `~${estimatedReach.toLocaleString()} customers` : "Not calculated"
        }\n\nThis will start sending immediately.`
      )
      if (!confirmed) return
    }
    setLoading(true)
    try {
        // Build the final templateParams:
        // - For media templates: prepend the mediaUrl as the first param automatically
        // - For text templates: use user-filled params matching placeholder count
        const textParams = params.slice(0, requiredPlaceholderIndexes.length).map(p => p || "")
        const templateParams = hasMediaHeader && templateMediaUrl
          ? [templateMediaUrl, ...textParams]
          : textParams

      const body = {
        name,
        templateId,
        templateName: templateName || name,
        templateParams,
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

  const citySuggestions = districtOptions.map((d) => d.name)
  const hasCityExactMatch =
    selectedCity.trim().length > 0 &&
    citySuggestions.some((name) => name.toLowerCase() === selectedCity.trim().toLowerCase())

  const shouldWarnCityMismatch = useCityFilter && selectedCity.trim().length > 0 && districtOptions.length > 0 && !hasCityExactMatch

  const disabledConfirm = loading || step3Issues.length > 0

  useEffect(() => {
    if ((!useCityFilter) || districtOptions.length > 0 || loadingDistricts) return

    const loadDistricts = async () => {
      setLoadingDistricts(true)
      try {
        const res = await fetch("/api/admin/campaigns/districts")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to load districts")
        setDistrictOptions(data.districts ?? [])
      } catch {
        // Soft-fail and keep free-text mode.
      } finally {
        setLoadingDistricts(false)
      }
    }

    loadDistricts()
  }, [useCityFilter, districtOptions.length, loadingDistricts])

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
                    setTemplateStatus(t.status ?? "")
                    setTemplateLanguage(t.language ?? "")
                    setHasMediaHeader(t.hasMediaHeader ?? false)
                    setTemplateMediaUrl(t.mediaUrl ?? "")
                    // Auto-fill param slots only for user-fillable text variables
                    setParams(
                      Array.from({ length: t.params.length }, () => "")
                    )
                    toast.success(`Template "${t.name}" selected`)
                  }}
                />

                {step1Issues.length > 0 && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <p className="font-medium">Before continuing:</p>
                    <ul className="mt-1 list-disc pl-4">
                      {step1Issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
                {previewMessage().includes("{{") && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Preview still contains unresolved placeholders. Fill or intentionally keep dynamic variables before sending.
                  </p>
                )}
                {unresolvedNumericPlaceholders.length > 0 && (
                  <p className="text-xs text-destructive">
                    Unresolved numeric placeholders: {unresolvedNumericPlaceholders.join(", ")}
                  </p>
                )}

                <datalist id="dynamic-vars-list">
                  {DYNAMIC_VARS.map((v) => (
                    <option key={v.key} value={v.key}>{v.label}</option>
                  ))}
                </datalist>

                <div className="space-y-2">
                  {params.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">This template does not require any variables.</p>
                    </div>
                  ) : (
                    params.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs w-12 shrink-0 justify-center">
                          {"{{" + (i + 1) + "}}"}
                        </Badge>
                        <Input
                          list="dynamic-vars-list"
                          value={p}
                          onChange={(e) => updateParam(i, e.target.value)}
                          placeholder="Double-click to select variable or type fixed text"
                          className="flex-1 text-sm bg-white dark:bg-zinc-900 shadow-sm"
                        />
                      </div>
                    ))
                  )}
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
                    {templateStatus && (
                      <p>
                        <span className="text-muted-foreground">Status:</span> {templateStatus}
                      </p>
                    )}
                    {templateLanguage && (
                      <p>
                        <span className="text-muted-foreground">Language:</span> {templateLanguage}
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
              <div className="space-y-2">
                <div className="flex items-start space-x-2.5">
                  <Checkbox
                    id="all"
                    checked={useAllOptedIn}
                    onCheckedChange={(c) => { setUseAllOptedIn(!!c); if(c){ setUseManual(false); setUseCityFilter(false); setUseMinSpendFilter(false); setUseNewCustomerFilter(false); } markEstimateStale() }}
                  />
                  <Label htmlFor="all" className="cursor-pointer">
                    <span className="font-medium">All opted-in customers</span>
                    <p className="text-xs text-muted-foreground font-normal">Everyone who agreed to receive messages.</p>
                  </Label>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Checkbox
                    id="new"
                    checked={useNewCustomerFilter}
                    onCheckedChange={(c) => { setUseNewCustomerFilter(!!c); if(c){ setUseAllOptedIn(false); setUseManual(false); } markEstimateStale() }}
                  />
                  <Label htmlFor="new" className="cursor-pointer">
                    <span className="font-medium">New customers</span>
                    <p className="text-xs text-muted-foreground font-normal">Customers who joined within N days.</p>
                  </Label>
                </div>

                {useNewCustomerFilter && (
                  <div className="pl-6 space-y-1.5 pb-2">
                    <Label className="text-xs">Joined in the last (days)</Label>
                    <Input
                      type="number"
                      value={daysSinceJoined}
                      onChange={(e) => { setDaysSinceJoined(e.target.value); markEstimateStale() }}
                      className="w-32 h-8"
                    />
                  </div>
                )}

                <div className="flex items-start space-x-2.5">
                  <Checkbox
                    id="spend"
                    checked={useMinSpendFilter}
                    onCheckedChange={(c) => { setUseMinSpendFilter(!!c); if(c){ setUseAllOptedIn(false); setUseManual(false); } markEstimateStale() }}
                  />
                  <Label htmlFor="spend" className="cursor-pointer">
                    <span className="font-medium">High-value customers</span>
                    <p className="text-xs text-muted-foreground font-normal">Customers above a total spend threshold.</p>
                  </Label>
                </div>

                {useMinSpendFilter && (
                  <div className="pl-6 space-y-1.5 pb-2">
                    <Label className="text-xs">Minimum total spend (₹)</Label>
                    <Input
                      type="number"
                      value={minSpend}
                      onChange={(e) => { setMinSpend(e.target.value); markEstimateStale() }}
                      placeholder="e.g. 1000"
                      className="w-32 h-8"
                    />
                  </div>
                )}

                <div className="flex items-start space-x-2.5">
                  <Checkbox
                    id="city"
                    checked={useCityFilter}
                    onCheckedChange={(c) => { setUseCityFilter(!!c); if(c){ setUseAllOptedIn(false); setUseManual(false); } markEstimateStale() }}
                  />
                  <Label htmlFor="city" className="cursor-pointer">
                    <span className="font-medium">Specific district</span>
                    <p className="text-xs text-muted-foreground font-normal">Filter by specific districts.</p>
                  </Label>
                </div>

                {useCityFilter && (
                  <div className="pl-6 space-y-1.5 pb-2">
                    <Label className="text-xs">District / City name</Label>
                    <Input
                      value={selectedCity}
                      onChange={(e) => { setSelectedCity(e.target.value); markEstimateStale() }}
                      placeholder="e.g. Chennai"
                      list="district-options"
                      className="w-56 h-8"
                    />
                    <datalist id="district-options">
                      {citySuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div className="flex items-start space-x-2.5 pt-2 border-t mt-2">
                  <Checkbox
                    id="manual"
                    checked={useManual}
                    onCheckedChange={(c) => { setUseManual(!!c); if(c){ setUseAllOptedIn(false); setUseCityFilter(false); setUseMinSpendFilter(false); setUseNewCustomerFilter(false); } markEstimateStale() }}
                  />
                  <Label htmlFor="manual" className="cursor-pointer">
                    <span className="font-medium">Manually select customers</span>
                    <p className="text-xs text-muted-foreground font-normal">Search and pick individual customers to send to.</p>
                  </Label>
                </div>

                {useManual && (
                  <div className="pl-6 pt-2">
                    <CustomerPicker
                      selected={selectedCustomers}
                      onChange={(value) => {
                        setSelectedCustomers(value)
                        setEstimatedReach(value.length)
                        setIsEstimateStale(false)
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={calculateReach}
                  disabled={estimating || (useCityFilter && !selectedCity) || (useMinSpendFilter && !minSpend)}
                >
                  {estimating ? "Calculating..." : "Calculate Reach"}
                </Button>
                {estimatedReach !== null && (
                  <p className="text-sm font-medium text-green-600">
                    ~<strong>{estimatedReach.toLocaleString()}</strong> customers
                  </p>
                )}
                {isEstimateStale && !useManual && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
                    Estimate stale
                  </Badge>
                )}
                {estimatedReach === null && (
                  <Badge variant="outline" className="text-xs">
                    Reach not calculated
                  </Badge>
                )}
              </div>
              {useCityFilter && estimatedReach === 0 && !estimating && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Reach is zero for this district. Verify district spelling or choose a suggested district name.
                </div>
              )}
              {step2Issues.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <p className="font-medium">Audience setup needs attention:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {step2Issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audience Summary Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Audience Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filters active</span>
                <div className="flex flex-col items-end gap-1">
                  {useAllOptedIn && <Badge variant="outline">All Customers</Badge>}
                  {useManual && <Badge variant="outline">Manual Selection ({selectedCustomers.length})</Badge>}
                  {useCityFilter && <Badge variant="outline">District: {selectedCity || "—"}</Badge>}
                  {useMinSpendFilter && <Badge variant="outline">Min Spend: ₹{minSpend || "—"}</Badge>}
                  {useNewCustomerFilter && <Badge variant="outline">Joined last {daysSinceJoined} days</Badge>}
                </div>
              </div>
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
              {step3Issues.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {step3Issues[0]}
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
                { label: "Template status", value: templateStatus || "—" },
                { label: "Template language", value: templateLanguage || "—" },
                { label: "Audience", value: useManual ? "Manual Selection" : useAllOptedIn ? "All Customers" : "Combined Filters" },
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
            disabled={
              (step === 1 && step1Issues.length > 0) ||
              (step === 2 && step2Issues.length > 0)
            }
          >
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => handleSubmit(true)} disabled={loading}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={disabledConfirm}>
              <Send className="mr-2 h-4 w-4" />
              {sendTiming === "later" ? "Confirm & Schedule" : "Confirm & Send"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

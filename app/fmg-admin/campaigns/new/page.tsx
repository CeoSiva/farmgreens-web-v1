"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Send, Clock, Users, Megaphone } from "lucide-react"

type FilterType = "all" | "new_customers" | "high_value" | "city"

export default function CreateCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [estimatedReach, setEstimatedReach] = useState<number | null>(null)

  // Step 1 state
  const [name, setName] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [params, setParams] = useState(["", "", "", "", ""])

  // Step 2 state
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [minSpend, setMinSpend] = useState("")
  const [city, setCity] = useState("")
  const [daysSinceJoined, setDaysSinceJoined] = useState("30")

  // Step 3 state
  const [sendTiming, setSendTiming] = useState<"now" | "later">("now")
  const [scheduledAt, setScheduledAt] = useState("")

  const updateParam = (i: number, val: string) => {
    const updated = [...params]
    updated[i] = val
    setParams(updated)
  }

  const previewMessage = () =>
    `Hi ${params[0] || "{{1}}"},\n\n${params.slice(1).filter(Boolean).join("\n")}`

  const buildFilter = () => ({
    type: filterType,
    ...(filterType === "high_value" && { minSpend: Number(minSpend) }),
    ...(filterType === "city" && { city }),
    ...(filterType === "new_customers" && { daysSinceJoined: Number(daysSinceJoined) }),
  })

  const calculateReach = async () => {
    setEstimating(true)
    try {
      const f = buildFilter()
      const qs = new URLSearchParams({
        filterType: f.type,
        ...(f.minSpend != null && { minSpend: String(f.minSpend) }),
        ...(f.city && { city: f.city }),
        ...(f.daysSinceJoined != null && { daysSinceJoined: String(f.daysSinceJoined) }),
      })
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
    setLoading(true)
    try {
      const body = {
        name,
        templateId,
        templateName,
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8 max-w-4xl">
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

      {/* Step indicators */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? "bg-green-500" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Template & Content */}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Template & Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Campaign Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Holi Offer 2026" />
              </div>
              <div className="space-y-1.5">
                <Label>Template ID (Gupshup UUID) *</Label>
                <Input value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1.5">
                <Label>Template Name (reference)</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. holi_offer_2026" />
              </div>
              <div>
                <Label className="mb-2 block">Template Variables</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Use <code className="bg-muted px-1 rounded">{"{{customerName}}"}</code> to personalize with customer's name.
                </p>
                <div className="space-y-2">
                  {params.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Variable {i + 1}</span>
                      <Input
                        value={p}
                        onChange={(e) => updateParam(i, e.target.value)}
                        placeholder={`{{${i + 1}}}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#e9fce9] rounded-xl p-4 font-mono text-sm whitespace-pre-wrap shadow-inner min-h-[200px] border border-[#c3ebbb]">
                {previewMessage()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Target Audience */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              {[
                { value: "all", label: "All opted-in customers" },
                { value: "new_customers", label: "New customers" },
                { value: "high_value", label: "High-value customers" },
                { value: "city", label: "Specific city / district" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>

            {filterType === "new_customers" && (
              <div className="space-y-1.5 ml-6">
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
              <div className="space-y-1.5 ml-6">
                <Label>Minimum spend (₹)</Label>
                <Input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="w-40"
                />
              </div>
            )}
            {filterType === "city" && (
              <div className="space-y-1.5 ml-6">
                <Label>City / District name</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-56"
                />
              </div>
            )}

            <Button variant="outline" onClick={calculateReach} disabled={estimating}>
              {estimating ? "Calculating..." : "Calculate Reach"}
            </Button>

            {estimatedReach !== null && (
              <p className="text-sm font-medium text-green-600">
                Estimated reach: <strong>{estimatedReach.toLocaleString()}</strong> customers
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={sendTiming} onValueChange={(v: "now" | "later") => setSendTiming(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now">Send immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="later" id="later" />
                <Label htmlFor="later">Schedule for later</Label>
              </div>
            </RadioGroup>

            {sendTiming === "later" && (
              <div className="space-y-1.5 ml-6">
                <Label>Scheduled date & time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-60"
                />
              </div>
            )}

            {/* Summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <p><strong>Campaign:</strong> {name || "—"}</p>
              <p><strong>Template ID:</strong> {templateId || "—"}</p>
              <p><strong>Audience:</strong> {filterType.replace("_", " ")}</p>
              <p><strong>Reach:</strong> {estimatedReach != null ? `~${estimatedReach.toLocaleString()} customers` : "Not yet estimated"}</p>
              <p><strong>Timing:</strong> {sendTiming === "now" ? "Immediately" : scheduledAt || "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-end">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        )}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}>
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

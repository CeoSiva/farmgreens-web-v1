"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CampaignStatusBadge, CampaignStatus } from "@/components/admin/campaigns/campaign-status-badge"
import { ArrowLeft, Download, Pause, Play, RefreshCw, Square, Users } from "lucide-react"
import { toast } from "sonner"

interface Campaign {
  _id: string; name: string; status: CampaignStatus
  totalRecipients: number; sentCount: number; deliveredCount: number
  readCount: number; failedCount: number
  deliveryRate: string; readRate: string; progress: string
  startedAt?: string; createdAt: string; completedAt?: string
}

interface FailedRecipient {
  phone: string; customerName: string; errorMessage?: string; createdAt: string
}

interface Recipient {
  _id: string; customerName: string; phone: string; status: string
  sentAt?: string; deliveredAt?: string; readAt?: string
}

const STATUS_FILTER = ["all", "sent", "delivered", "read", "failed"]

export function CampaignDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [failedRecipients, setFailedRecipients] = useState<FailedRecipient[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [recipientPage, setRecipientPage] = useState(1)
  const [totalRecipientPages, setTotalRecipientPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`)
      const data = await res.json()
      setCampaign(data.campaign)
      setFailedRecipients(data.failedRecipients ?? [])
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchRecipients = useCallback(async () => {
    const qs = new URLSearchParams({
      page: String(recipientPage),
      limit: "50",
      ...(statusFilter !== "all" && { status: statusFilter }),
    })
    const res = await fetch(`/api/admin/campaigns/${id}/recipients?${qs}`)
    const data = await res.json()
    setRecipients(data.recipients ?? [])
    setTotalRecipientPages(data.pagination?.pages ?? 1)
  }, [id, recipientPage, statusFilter])

  useEffect(() => { fetchDetail(); fetchRecipients() }, [fetchDetail, fetchRecipients])

  // Auto-refresh every 15s while running
  useEffect(() => {
    if (campaign?.status !== "running") return
    const t = setInterval(() => { fetchDetail(); fetchRecipients() }, 15000)
    return () => clearInterval(t)
  }, [campaign?.status, fetchDetail, fetchRecipients])

  const handleAction = async (action: string, method: "POST" | "PATCH") => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/${action}`, { method })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message ?? "Done")
      fetchDetail()
    } catch (err: any) {
      toast.error(err.message ?? "Action failed")
    }
  }

  const exportFailedCSV = () => {
    const header = "Phone,Customer Name,Error,Date"
    const rows = failedRecipients.map(
      (r) => `${r.phone},"${r.customerName}","${r.errorMessage ?? ""}",${r.createdAt}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `failed-${id}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!campaign) return <p className="p-6 text-muted-foreground">Campaign not found.</p>

  const pct = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(0)}%` : "0%"

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/fmg-admin/campaigns")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Created {new Date(campaign.createdAt).toLocaleDateString()}
              {campaign.startedAt && ` · Started ${new Date(campaign.startedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { fetchDetail(); fetchRecipients() }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {campaign.status === "running" && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleAction("pause", "PATCH")}>
                <Pause className="mr-1 h-3 w-3" /> Pause
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleAction("stop", "PATCH")}>
                <Square className="mr-1 h-3 w-3" /> Stop
              </Button>
            </>
          )}
          {campaign.status === "paused" && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleAction("resume", "PATCH")}>
                <Play className="mr-1 h-3 w-3" /> Resume
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleAction("stop", "PATCH")}>
                <Square className="mr-1 h-3 w-3" /> Stop
              </Button>
            </>
          )}
          {["draft", "scheduled"].includes(campaign.status) && (
            <Button size="sm" onClick={() => handleAction("send", "POST")}>
              <Play className="mr-1 h-3 w-3" /> Send Now
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar (running / paused) */}
      {["running", "paused"].includes(campaign.status) && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                {campaign.sentCount.toLocaleString()} of {campaign.totalRecipients.toLocaleString()} sent ({campaign.progress}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${campaign.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Recipients", value: campaign.totalRecipients.toLocaleString(), sub: "" },
          { label: "Sent", value: campaign.sentCount.toLocaleString(), sub: pct(campaign.sentCount, campaign.totalRecipients) },
          { label: "Delivered", value: campaign.deliveredCount.toLocaleString(), sub: `${campaign.deliveryRate}% of sent` },
          { label: "Read", value: campaign.readCount.toLocaleString(), sub: `${campaign.readRate}% of sent` },
          { label: "Failed", value: campaign.failedCount.toLocaleString(), sub: pct(campaign.failedCount, campaign.sentCount), accent: campaign.failedCount > 0 ? "text-red-600" : "" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.accent ?? ""}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Delivery Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            {[
              { label: "Sent", value: campaign.sentCount, color: "bg-blue-400" },
              { label: "Delivered", value: campaign.deliveredCount, color: "bg-green-400" },
              { label: "Read", value: campaign.readCount, color: "bg-emerald-600" },
            ].map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-medium">{bar.value.toLocaleString()}</span>
                <div
                  className={`w-full rounded-t ${bar.color}`}
                  style={{
                    height: `${campaign.sentCount > 0 ? (bar.value / campaign.sentCount) * 96 : 0}px`,
                    minHeight: 4,
                  }}
                />
                <span className="text-xs text-muted-foreground">{bar.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipients Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Recipients
          </CardTitle>
          <div className="flex items-center gap-2">
            {STATUS_FILTER.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => { setStatusFilter(s); setRecipientPage(1) }}
              >
                {s}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Delivered At</TableHead>
                <TableHead>Read At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No recipients found.
                  </TableCell>
                </TableRow>
              ) : recipients.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.customerName}</TableCell>
                  <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-xs">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-xs">{r.readAt ? new Date(r.readAt).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalRecipientPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Button size="sm" variant="outline" disabled={recipientPage <= 1} onClick={() => setRecipientPage(p => p - 1)}>Prev</Button>
              <span className="text-xs text-muted-foreground">Page {recipientPage} of {totalRecipientPages}</span>
              <Button size="sm" variant="outline" disabled={recipientPage >= totalRecipientPages} onClick={() => setRecipientPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Messages */}
      {failedRecipients.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-destructive text-sm">Failed Messages ({failedRecipients.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={exportFailedCSV}>
              <Download className="mr-1 h-3 w-3" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedRecipients.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell className="text-xs text-destructive">{r.errorMessage ?? "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(r.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

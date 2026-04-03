"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CampaignStatusBadge, CampaignStatus } from "@/components/admin/campaigns/campaign-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MegaphoneIcon, Play, Pause, Square, Eye, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Campaign {
  _id: string
  name: string
  status: CampaignStatus
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  scheduledAt?: string
  startedAt?: string
  deliveryRate: string
  readRate: string
  progress: string
}

export function CampaignListClient() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/campaigns")
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch {
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Auto-refresh every 30s if any campaign is running
  useEffect(() => {
    const hasRunning = campaigns.some((c) => c.status === "running")
    if (!hasRunning) return
    const interval = setInterval(fetchCampaigns, 30000)
    return () => clearInterval(interval)
  }, [campaigns, fetchCampaigns])

  const handleAction = async (
    id: string,
    action: "send" | "stop" | "pause" | "resume",
    method: "POST" | "PATCH"
  ) => {
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/${action}`, { method })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message ?? "Done")
      fetchCampaigns()
    } catch (err: any) {
      toast.error(err.message ?? "Action failed")
    }
  }

  const totalCampaigns = campaigns.length
  const activeNow = campaigns.filter((c) => c.status === "running").length
  const totalReached = campaigns.reduce((s, c) => s + c.sentCount, 0)
  const completed = campaigns.filter((c) => c.status === "completed")
  const avgReadRate =
    completed.length > 0
      ? (completed.reduce((s, c) => s + Number(c.readRate), 0) / completed.length).toFixed(1)
      : "0"

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MegaphoneIcon className="h-6 w-6 text-green-600" />
            WhatsApp Campaigns
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your WhatsApp marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/fmg-admin/campaigns/new">+ Create Campaign</Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: totalCampaigns },
          { label: "Active Now", value: activeNow, accent: "text-green-600" },
          { label: "Total Reached", value: totalReached.toLocaleString() },
          { label: "Avg Read Rate", value: `${avgReadRate}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.accent ?? ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Read</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No campaigns yet. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">{c.totalRecipients.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{c.sentCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {c.deliveredCount.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({c.deliveryRate}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.readCount.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({c.readRate}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{c.failedCount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.startedAt
                        ? new Date(c.startedAt).toLocaleDateString()
                        : c.scheduledAt
                        ? `Scheduled ${new Date(c.scheduledAt).toLocaleDateString()}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View"
                          onClick={() => router.push(`/fmg-admin/campaigns/${c._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {["draft", "scheduled"].includes(c.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Send Now"
                            onClick={() => handleAction(c._id, "send", "POST")}
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {c.status === "running" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Pause"
                            onClick={() => handleAction(c._id, "pause", "PATCH")}
                          >
                            <Pause className="h-4 w-4 text-yellow-600" />
                          </Button>
                        )}
                        {c.status === "paused" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Resume"
                            onClick={() => handleAction(c._id, "resume", "PATCH")}
                          >
                            <Play className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {["running", "paused", "scheduled"].includes(c.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Stop"
                            onClick={() => handleAction(c._id, "stop", "PATCH")}
                          >
                            <Square className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

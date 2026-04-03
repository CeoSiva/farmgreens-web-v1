import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "stopped"

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  draft:     { label: "Draft",     className: "bg-gray-100 text-gray-700 border-gray-300" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-300" },
  running:   { label: "Running",   className: "bg-green-100 text-green-700 border-green-300", pulse: true },
  paused:    { label: "Paused",    className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  stopped:   { label: "Stopped",   className: "bg-red-100 text-red-700 border-red-300" },
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <Badge variant="outline" className={cn("gap-1.5 text-xs", config.className)}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
        </span>
      )}
      {config.label}
    </Badge>
  )
}

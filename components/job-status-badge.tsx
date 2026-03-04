import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusConfig: Record<
  string,
  { className: string; label: string }
> = {
  pending: {
    className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    label: "Pending",
  },
  queued: {
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    label: "Queued",
  },
  processing: {
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    label: "Processing",
  },
  completed: {
    className: "bg-green-500/15 text-green-400 border-green-500/30",
    label: "Completed",
  },
  failed: {
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    label: "Failed",
  },
}

export function JobStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.pending
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
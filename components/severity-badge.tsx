import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const severityConfig: Record<
  string,
  { className: string; label: string }
> = {
  critical: {
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    label: "Critical",
  },
  high: {
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    label: "High",
  },
  medium: {
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    label: "Medium",
  },
  low: {
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    label: "Low",
  },
  info: {
    className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    label: "Info",
  },
}

export function SeverityBadge({ severity }: { severity: string | null | undefined }) {
  const config = severityConfig[severity?.toLowerCase() || ''] || severityConfig.info
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}

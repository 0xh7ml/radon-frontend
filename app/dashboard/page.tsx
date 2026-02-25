"use client"

import * as React from "react"
import { api } from "@/lib/api"
import { SectionCards } from "@/components/section-cards"
import { IconLoader2 } from "@tabler/icons-react"

interface Stats {
  total_domains?: number
  total_subdomains?: number
  total_ports?: number
  total_vulnerabilities?: number
  vulnerability_breakdown?: {
    critical?: number
    high?: number
    medium?: number
    low?: number
    info?: number
  }
  [key: string]: unknown
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    api
      .get<Stats>("/api/stats")
      .then((res) => setStats(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load stats")
      )
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
        <p className="text-sm text-muted-foreground">{error}</p>
        <p className="text-xs text-muted-foreground">
          Make sure NEXT_PUBLIC_API_URL is set and the API is running.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards stats={stats} />
    </div>
  )
}

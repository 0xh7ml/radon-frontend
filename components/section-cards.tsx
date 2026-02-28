"use client"

import {
  IconBug,
  IconPlugConnected,
  IconRadar,
  IconSubtask,
  IconWorld,
} from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatsData {
  total_domains?: number
  total_subdomains?: number
  total_ports?: number
  total_probed_hosts?: number
  total_vulnerabilities?: number
  vulnerability_breakdown?: Record<string, number>
  [key: string]: unknown
}

export function SectionCards({ stats }: { stats: StatsData | null }) {
  const cards = [
    {
      title: "Total Domains",
      value: stats?.total_domains ?? 0,
      icon: IconWorld,
    },
    {
      title: "Total Subdomains",
      value: stats?.total_subdomains ?? 0,
      icon: IconSubtask,
    },
    {
      title: "Open Ports",
      value: stats?.total_ports ?? 0,
      icon: IconPlugConnected,
    },
    {
      title: "Probed Hosts",
      value: stats?.total_probed_hosts ?? 0,
      icon: IconRadar,
    },
    {
      title: "Vulnerabilities",
      value: stats?.total_vulnerabilities ?? 0,
      icon: IconBug,
      extra: stats?.vulnerability_breakdown
        ? `${stats.vulnerability_breakdown.critical ?? 0} critical`
        : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-5 lg:px-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {card.value.toLocaleString()}
            </div>
            {card.extra && (
              <p className="mt-1 text-xs text-destructive">{card.extra}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

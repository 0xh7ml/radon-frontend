"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface VulnBreakdown {
  critical?: number
  high?: number
  medium?: number
  low?: number
  info?: number
}

const severityColors: Record<string, string> = {
  Critical: "hsl(0, 84%, 60%)",
  High: "hsl(25, 95%, 53%)",
  Medium: "hsl(43, 96%, 56%)",
  Low: "hsl(199, 89%, 48%)",
  Info: "hsl(218, 11%, 55%)",
}

export function ChartAreaInteractive({
  breakdown,
}: {
  breakdown: VulnBreakdown | null
}) {
  const chartData = [
    { severity: "Critical", count: breakdown?.critical ?? 0, fill: severityColors.Critical },
    { severity: "High", count: breakdown?.high ?? 0, fill: severityColors.High },
    { severity: "Medium", count: breakdown?.medium ?? 0, fill: severityColors.Medium },
    { severity: "Low", count: breakdown?.low ?? 0, fill: severityColors.Low },
    { severity: "Info", count: breakdown?.info ?? 0, fill: severityColors.Info },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vulnerability Severity Distribution</CardTitle>
        <CardDescription>
          Breakdown of discovered vulnerabilities by severity level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="severity"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

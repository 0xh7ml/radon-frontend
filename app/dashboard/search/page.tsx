"use client"

import * as React from "react"
import {
  IconBug,
  IconLoader2,
  IconPlugConnected,
  IconSearch,
  IconSubtask,
  IconWorld,
} from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SeverityBadge } from "@/components/severity-badge"

interface SearchResult {
  type: string
  id: number
  name?: string
  host?: string
  severity?: string
  ip?: string
  port?: number
  [key: string]: unknown
}

const searchTypes = [
  { value: "all", label: "All Types" },
  { value: "domain", label: "Domains" },
  { value: "subdomain", label: "Subdomains" },
  { value: "ip", label: "IPs" },
  { value: "vulnerability", label: "Vulnerabilities" },
]

const typeIcons: Record<string, React.ReactNode> = {
  domain: <IconWorld className="h-4 w-4" />,
  subdomain: <IconSubtask className="h-4 w-4" />,
  ip: <IconPlugConnected className="h-4 w-4" />,
  vulnerability: <IconBug className="h-4 w-4" />,
}

export default function SearchPage() {
  const [query, setQuery] = React.useState("")
  const [type, setType] = React.useState("all")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({ q: query.trim() })
      if (type !== "all") params.set("type", type)
      const res = await api.get<SearchResult[]>(
        `/api/search?${params.toString()}`
      )
      setResults(Array.isArray(res.data) ? res.data : [])
    } catch {
      toast.error("Search failed")
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const grouped = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    for (const result of results) {
      const key = result.type || "other"
      if (!groups[key]) groups[key] = []
      groups[key].push(result)
    }
    return groups
  }, [results])

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search domains, subdomains, IPs, vulnerabilities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {searchTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconSearch className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </form>

      {isSearching && (
        <div className="flex items-center justify-center py-20">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <IconSearch className="h-12 w-12" />
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm">
            {"Try adjusting your search query or type filter."}
          </p>
        </div>
      )}

      {!isSearching &&
        Object.keys(grouped).length > 0 &&
        Object.entries(grouped).map(([groupType, items]) => (
          <Card key={groupType}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {typeIcons[groupType]}
                <span className="capitalize">{groupType}s</span>
                <Badge variant="secondary" className="ml-1">
                  {items.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {items.length} result{items.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                {items.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {item.name || item.host || item.ip || `#${item.id}`}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.port && <span>Port: {item.port}</span>}
                        {item.ip && item.name && <span>IP: {item.ip}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.severity && (
                        <SeverityBadge severity={item.severity} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

      {!hasSearched && (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <IconSearch className="h-12 w-12" />
          <p className="text-lg font-medium">Search across your data</p>
          <p className="text-sm">
            {"Find domains, subdomains, IPs, and vulnerabilities."}
          </p>
        </div>
      )}
    </div>
  )
}

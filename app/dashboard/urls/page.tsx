"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconExternalLink, IconLoader2 } from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"
import { api } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { FileUploadDialog } from "@/components/file-upload-dialog"

interface UrlRow {
  id: number
  url: string
  path: string | null
  source: string | null
  subdomainId: number
  subdomain: string
  domainId: number
  domain: string
  createdAt: string
}

interface Pagination {
  total: number
  totalPages: number
}

const LIMIT = 50

function useDebounced<T>(value: T, ms = 400) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function UrlsPage() {
  const [rows, setRows] = React.useState<UrlRow[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({ total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [domain, setDomain] = React.useState("")
  const [subdomain, setSubdomain] = React.useState("")
  const [source, setSource] = React.useState("")

  const dSearch = useDebounced(search)
  const dDomain = useDebounced(domain)
  const dSubdomain = useDebounced(subdomain)
  const dSource = useDebounced(source)

  // Any filter change resets to page 1
  React.useEffect(() => {
    setPage(1)
  }, [dSearch, dDomain, dSubdomain, dSource])

  const fetchUrls = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (dSearch) params.set("search", dSearch)
      if (dDomain) params.set("domain", dDomain)
      if (dSubdomain) params.set("subdomain", dSubdomain)
      if (dSource) params.set("source", dSource)

      const res = (await api.get<UrlRow[]>(`/api/urls?${params}`)) as any
      setRows(Array.isArray(res.data) ? res.data : [])
      setPagination({
        total: res.pagination?.total ?? 0,
        totalPages: Math.max(1, res.pagination?.totalPages ?? 1),
      })
    } catch (error: any) {
      setRows([])
      if (error?.message && error.message !== "Unauthorized") {
        toast.error("Failed to load URLs")
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, dSearch, dDomain, dSubdomain, dSource])

  React.useEffect(() => {
    fetchUrls()
  }, [fetchUrls])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("scan_type", "url")
    const result = (await api.upload<{ jobId?: string }>("/api/upload", formData)) as any
    if (result.success && result.data?.jobId) {
      toast.success(`URL upload accepted. Job ID: ${result.data.jobId.slice(0, 8)}...`)
    } else {
      toast.success("URL upload successful!")
    }
    setTimeout(fetchUrls, 1000)
  }

  const columns: ColumnDef<UrlRow>[] = [
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex max-w-[560px] items-center gap-1 truncate font-mono text-xs hover:underline"
          title={row.original.url}
        >
          <span className="truncate">{row.original.url}</span>
          <IconExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
        </a>
      ),
    },
    {
      accessorKey: "subdomain",
      header: "Subdomain",
      cell: ({ row }) => <span className="text-sm">{row.original.subdomain}</span>,
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.domain}</span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) =>
        row.original.source ? <Badge variant="outline">{row.original.source}</Badge> : "-",
    },
  ]

  if (isLoading && rows.length === 0 && !dSearch && !dDomain && !dSubdomain && !dSource) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <DataTable
        columns={columns}
        data={rows}
        serverPagination={{
          page,
          pageSize: LIMIT,
          totalPages: pagination.totalPages,
          onPageChange: setPage,
        }}
        toolbar={
          <>
            <Input
              placeholder="Search URLs..."
              className="h-8 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Input
              placeholder="Domain (exact)"
              className="h-8 w-40"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <Input
              placeholder="Subdomain"
              className="h-8 w-40"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
            />
            <Input
              placeholder="Source"
              className="h-8 w-32"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">{pagination.total} URLs</span>
            <FileUploadDialog
              title="Upload URLs"
              description='Upload urlfinder NDJSON output ({"url","input","source"} per line).'
              accept=".json,.jsonl,.ndjson,.txt"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

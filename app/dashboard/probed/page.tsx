"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { FileUploadDialog } from "@/components/file-upload-dialog"

interface ProbedHost {
  id: number
  host: string
  status_code: number
  scheme: string
  title?: string
  content_length?: number
  tech?: string[]
}

interface PaginatedResponse {
  items?: ProbedHost[]
  data?: ProbedHost[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "border-green-500/30 bg-green-500/10 text-green-400"
  if (code >= 300 && code < 400) return "border-blue-500/30 bg-blue-500/10 text-blue-400"
  if (code >= 400 && code < 500) return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
  return "border-red-500/30 bg-red-500/10 text-red-400"
}

export default function ProbedPage() {
  const [allData, setAllData] = React.useState<ProbedHost[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [itemsPerPage] = React.useState(20)
  const [statusFilter, setStatusFilter] = React.useState("")
  const [schemeFilter, setSchemeFilter] = React.useState("")
  const [techFilter, setTechFilter] = React.useState("")
  const [webserverFilter, setWebserverFilter] = React.useState("")
  const [titleFilter, setTitleFilter] = React.useState("")
  const [cdnNameFilter, setCdnNameFilter] = React.useState("")
  const [cdnTypeFilter, setCdnTypeFilter] = React.useState("")
  const [inputFilter, setInputFilter] = React.useState("")
  const [inputDomainFilter, setInputDomainFilter] = React.useState("")

const fetchProbed = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000" })
      const res = await api.get<PaginatedResponse>(`/api/probed?${params.toString()}`)
      const resData = res.data
      const items = resData?.items || resData?.data || (Array.isArray(resData) ? resData : [])
      setAllData(Array.isArray(items) ? items : [])
    } catch (error: any) {
      // Only show error toast if it's not a "no data" situation
      if (error?.response?.status !== 404) {
        toast.error("Failed to load probed hosts")
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchProbed()
  }, [])

  // Client-side filtering and pagination
  const { data, totalPages } = React.useMemo(() => {
    let filtered = [...allData]
    
    // Apply filters
    if (statusFilter) {
      filtered = filtered.filter(host => 
        String(host.status_code).includes(statusFilter)
      )
    }
    
    if (schemeFilter && schemeFilter !== "all") {
      filtered = filtered.filter(host => host.scheme === schemeFilter)
    }
    
    if (techFilter) {
      filtered = filtered.filter(host => 
        host.tech?.some(tech => tech.toLowerCase().includes(techFilter.toLowerCase()))
      )
    }
    
    if (webserverFilter) {
      filtered = filtered.filter(host => 
        host.title?.toLowerCase().includes(webserverFilter.toLowerCase()) // Assuming webserver info is in title or similar field
      )
    }
    
    if (titleFilter) {
      filtered = filtered.filter(host => 
        host.title?.toLowerCase().includes(titleFilter.toLowerCase())
      )
    }
    
    if (cdnNameFilter) {
      filtered = filtered.filter(host => 
        host.host.toLowerCase().includes(cdnNameFilter.toLowerCase()) // Assuming CDN info might be in host
      )
    }
    
    if (cdnTypeFilter) {
      filtered = filtered.filter(host => 
        host.host.toLowerCase().includes(cdnTypeFilter.toLowerCase())
      )
    }
    
    if (inputFilter) {
      filtered = filtered.filter(host => 
        host.host.toLowerCase().includes(inputFilter.toLowerCase())
      )
    }
    
    if (inputDomainFilter) {
      filtered = filtered.filter(host => 
        host.host.toLowerCase().includes(inputDomainFilter.toLowerCase())
      )
    }
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage)
    
    return { data: paginatedData, totalPages }
  }, [allData, statusFilter, schemeFilter, techFilter, webserverFilter, titleFilter, cdnNameFilter, cdnTypeFilter, inputFilter, inputDomainFilter, page, itemsPerPage])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("scan_type", "probed")
    await api.upload("/api/upload", formData)
    fetchProbed()
  }

  const columns: ColumnDef<ProbedHost>[] = [
    {
      accessorKey: "host",
      header: "Host",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.host}</span>
      ),
    },
    {
      accessorKey: "status_code",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={statusColor(row.original.status_code)}
        >
          {row.original.status_code}
        </Badge>
      ),
    },
    {
      accessorKey: "scheme",
      header: "Scheme",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground uppercase">
          {row.original.scheme}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate text-sm text-muted-foreground">
          {row.original.title || "-"}
        </span>
      ),
    },
    {
      accessorKey: "content_length",
      header: "Size",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.content_length != null
            ? `${row.original.content_length}`
            : "-"}
        </span>
      ),
    },
  ]

  if (isLoading && data.length === 0) {
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
        data={data}
        serverPagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        toolbar={
          <>
            <Input
              placeholder="Filter status code..."
              className="h-8 w-32"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
            />
            <Select
              value={schemeFilter || "all"}
              onValueChange={(v) => {
                setSchemeFilter(v === "all" ? "" : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue placeholder="Scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="https">HTTPS</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter technology..."
              className="h-8 w-36"
              value={techFilter}
              onChange={(e) => {
                setTechFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter webserver..."
              className="h-8 w-36"
              value={webserverFilter}
              onChange={(e) => {
                setWebserverFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter title..."
              className="h-8 w-32"
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter CDN name..."
              className="h-8 w-36"
              value={cdnNameFilter}
              onChange={(e) => {
                setCdnNameFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter CDN type..."
              className="h-8 w-36"
              value={cdnTypeFilter}
              onChange={(e) => {
                setCdnTypeFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter input..."
              className="h-8 w-28"
              value={inputFilter}
              onChange={(e) => {
                setInputFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter input domain..."
              className="h-8 w-40"
              value={inputDomainFilter}
              onChange={(e) => {
                setInputDomainFilter(e.target.value)
                setPage(1)
              }}
            />
            <FileUploadDialog
              title="Upload Probed Hosts"
              description="Upload an NDJSON file (httpx output). Each line: {&quot;input&quot;:&quot;sub.example.com&quot;,&quot;url&quot;:&quot;https://...&quot;,&quot;status_code&quot;:200,&quot;title&quot;:&quot;...&quot;,&quot;scheme&quot;:&quot;https&quot;,...}"
              accept=".json,.jsonl,.txt"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

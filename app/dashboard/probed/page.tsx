"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

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
  input: string
  domain: string
  url: string
  port: number
  title?: string
  scheme: string
  webserver?: string
  contentType?: string
  tech?: string[]
  statusCode: number
  contentLength?: number
  cdnName?: string
  cdnType?: string
  createdAt: string
  updatedAt: string
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
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/probed?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("jwt_token")
            localStorage.removeItem("jwt_user")
            window.location.href = "/signin"
          }
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log("Probed API response:", result)
      
      // Handle different response structures
      const items = result.data || result.items || (Array.isArray(result) ? result : [])
      setAllData(Array.isArray(items) ? items : [])
    } catch (error: any) {
      console.error("Probed fetch error:", error)
      // Only show error toast if it's not a "no data" situation
      if (error?.message && !error.message.includes('404')) {
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
        String(host.statusCode).includes(statusFilter)
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
        host.webserver?.toLowerCase().includes(webserverFilter.toLowerCase())
      )
    }
    
    if (titleFilter) {
      filtered = filtered.filter(host => 
        host.title?.toLowerCase().includes(titleFilter.toLowerCase())
      )
    }
    
    if (cdnNameFilter) {
      filtered = filtered.filter(host => 
        host.cdnName?.toLowerCase().includes(cdnNameFilter.toLowerCase())
      )
    }
    
    if (cdnTypeFilter) {
      filtered = filtered.filter(host => 
        host.cdnType?.toLowerCase().includes(cdnTypeFilter.toLowerCase())
      )
    }
    
    if (inputFilter) {
      filtered = filtered.filter(host => 
        host.input.toLowerCase().includes(inputFilter.toLowerCase())
      )
    }
    
    if (inputDomainFilter) {
      filtered = filtered.filter(host => 
        host.domain.toLowerCase().includes(inputDomainFilter.toLowerCase())
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
    
    const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("jwt_token")
          localStorage.removeItem("jwt_user")
          window.location.href = "/signin"
        }
        return
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed with status ${response.status}`)
    }
    
    const result = await response.json()
    console.log("Upload result:", result)
    
    // Show success message with job ID
    if (result.success && result.data?.jobId) {
      toast.success(`Probed hosts upload queued successfully! Job ID: ${result.data.jobId.slice(0, 8)}...`)
    } else {
      toast.success("Probed hosts upload successful!")
    }
    
    // Note: Don't refresh immediately as processing is async
  }

  const columns: ColumnDef<ProbedHost>[] = [
    {
      accessorKey: "input",
      header: "Host",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.input}</span>
      ),
    },
    {
      accessorKey: "statusCode",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={statusColor(row.original.statusCode)}
        >
          {row.original.statusCode}
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
      accessorKey: "contentLength",
      header: "Size",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.contentLength != null
            ? `${row.original.contentLength}`
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "webserver",
      header: "Server",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.webserver || "-"}
        </span>
      ),
    },
    {
      accessorKey: "tech",
      header: "Tech",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tech?.slice(0, 2).map((t, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {t}
            </Badge>
          )) || (
            <span className="text-xs text-muted-foreground">-</span>
          )}
          {row.original.tech && row.original.tech.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.tech.length - 2}
            </Badge>
          )}
        </div>
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
              placeholder="Filter by host..."
              className="h-8 w-40"
              value={inputFilter}
              onChange={(e) => {
                setInputFilter(e.target.value)
                setPage(1)
              }}
            />
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
              placeholder="Filter by domain..."
              className="h-8 w-36"
              value={inputDomainFilter}
              onChange={(e) => {
                setInputDomainFilter(e.target.value)
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
            <FileUploadDialog
              title="Upload Probed Hosts"
              description={`Upload an NDJSON file (httpx output).\n\nExample format:\n{"input":"sub.example.com","url":"https://...","statusCode":200,"title":"...","scheme":"https"}`}
              accept=".json,.jsonl,.txt"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

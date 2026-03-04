"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

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
import { SeverityBadge } from "@/components/severity-badge"

interface Vulnerability {
  id: number
  name: string
  severity: string
  host: string
  port?: number
  template_id?: string
  description?: string
  matched_at?: string
}

interface PaginatedResponse {
  items?: Vulnerability[]
  data?: Vulnerability[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export default function VulnerabilitiesPage() {
  const [allData, setAllData] = React.useState<Vulnerability[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [itemsPerPage] = React.useState(20)
  const [severityFilter, setSeverityFilter] = React.useState("")
  const [portFilter, setPortFilter] = React.useState("")
  const [templateIdFilter, setTemplateIdFilter] = React.useState("")
  const [hostFilter, setHostFilter] = React.useState("")
  const [hostDomainFilter, setHostDomainFilter] = React.useState("")

  const fetchVulnerabilities = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000" })
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/vulns?${params.toString()}`, {
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
      console.log("Vulnerabilities API response:", result)
      
      // Handle different response structures
      const items = result.data || result.items || (Array.isArray(result) ? result : [])
      setAllData(Array.isArray(items) ? items : [])
    } catch (error: any) {
      console.error("Vulnerabilities fetch error:", error)
      // Only show error toast if it's not a "no data" situation
      if (error?.message && !error.message.includes('404')) {
        toast.error("Failed to load vulnerabilities")
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchVulnerabilities()
  }, [])

  // Client-side filtering and pagination
  const { data, totalPages } = React.useMemo(() => {
    let filtered = [...allData]
    
    // Apply filters
    if (severityFilter && severityFilter !== "all") {
      filtered = filtered.filter(vuln => vuln.severity === severityFilter)
    }
    
    if (portFilter) {
      filtered = filtered.filter(vuln => 
        String(vuln.port || '').includes(portFilter)
      )
    }
    
    if (templateIdFilter) {
      filtered = filtered.filter(vuln => 
        vuln.template_id?.toLowerCase().includes(templateIdFilter.toLowerCase())
      )
    }
    
    if (hostFilter) {
      filtered = filtered.filter(vuln => 
        vuln.host.toLowerCase().includes(hostFilter.toLowerCase())
      )
    }
    
    if (hostDomainFilter) {
      filtered = filtered.filter(vuln => 
        vuln.host.toLowerCase().includes(hostDomainFilter.toLowerCase())
      )
    }
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage)
    
    return { data: paginatedData, totalPages }
  }, [allData, severityFilter, portFilter, templateIdFilter, hostFilter, hostDomainFilter, page, itemsPerPage])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("scan_type", "vuln")
    
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
      toast.success(`Vulnerability upload queued successfully! Job ID: ${result.data.jobId.slice(0, 8)}...`)
    } else {
      toast.success("Vulnerability upload successful!")
    }
    
    // Note: Don't refresh immediately as processing is async
  }

  const columns: ColumnDef<Vulnerability>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="max-w-[250px] truncate font-medium">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
      accessorKey: "host",
      header: "Host",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.host}</span>
      ),
    },
    {
      accessorKey: "port",
      header: "Port",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.port ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "template_id",
      header: "Template",
      cell: ({ row }) => (
        <span className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
          {row.original.template_id || "-"}
        </span>
      ),
    },
    {
      accessorKey: "matched_at",
      header: "Matched At",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate text-xs text-muted-foreground">
          {row.original.matched_at || "-"}
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
            <Select
              value={severityFilter || "all"}
              onValueChange={(v) => {
                setSeverityFilter(v === "all" ? "" : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter port..."
              className="h-8 w-28"
              value={portFilter}
              onChange={(e) => {
                setPortFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter template ID..."
              className="h-8 w-36"
              value={templateIdFilter}
              onChange={(e) => {
                setTemplateIdFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter host..."
              className="h-8 w-32"
              value={hostFilter}
              onChange={(e) => {
                setHostFilter(e.target.value)
                setPage(1)
              }}
            />
            <Input
              placeholder="Filter host domain..."
              className="h-8 w-36"
              value={hostDomainFilter}
              onChange={(e) => {
                setHostDomainFilter(e.target.value)
                setPage(1)
              }}
            />
            <FileUploadDialog
              title="Upload Vulnerabilities"
              description="Upload an NDJSON file (nuclei output). Each line: {&quot;host&quot;:&quot;sub.example.com&quot;,&quot;template_id&quot;:&quot;...&quot;,&quot;info&quot;:{&quot;name&quot;:&quot;...&quot;,&quot;severity&quot;:&quot;high&quot;},...}"
              accept=".json,.jsonl,.txt"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

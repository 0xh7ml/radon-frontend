"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

import { api } from "@/lib/api"
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
      const res = await api.get<PaginatedResponse>("/api/vulns")
      const resData = res.data
      const items = resData?.items || resData?.data || (Array.isArray(resData) ? resData : [])
      setAllData(Array.isArray(items) ? items : [])
    } catch (error: any) {
      // Only show error toast if it's not a "no data" situation
      if (error?.response?.status !== 404) {
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
    await api.upload("/api/vulns", formData)
    fetchVulnerabilities()
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
              description="Upload a JSON file with vulnerabilities data."
              accept=".json"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

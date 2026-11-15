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

interface Port {
  id: number
  host: string
  domain: string
  ip: string
  port: number
  protocol: string
  tls: boolean
}

export default function PortsPage() {
  const [allData, setAllData] = React.useState<Port[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [hostDomainFilter, setHostDomainFilter] = React.useState("all")
  const [hostFilter, setHostFilter] = React.useState("")
  const [portFilter, setPortFilter] = React.useState("all")

  const [domainOptions, setDomainOptions] = React.useState<string[]>([])
  const [portOptions, setPortOptions] = React.useState<number[]>([])

  const apiGet = async (path: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}${path}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
  }

  // Options come from the whole table, not from the rows currently loaded
  const fetchOptions = async () => {
    try {
      const res = await apiGet("/api/ports/filters")
      if (!res.ok) return
      const { data } = await res.json()
      setDomainOptions(data?.domains ?? [])
      setPortOptions(data?.ports ?? [])
    } catch (e) {
      console.error("Port filter options error:", e)
    }
  }

  const fetchPorts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000" })
      if (hostDomainFilter !== "all") params.set("domain", hostDomainFilter)
      if (portFilter !== "all") params.set("port", portFilter)
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/ports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 404) {
        setAllData([]) // empty result for this filter
        return
      }
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
      console.log("Ports API response:", result)
      setAllData(Array.isArray(result.data) ? result.data : [])
    } catch (error: any) {
      console.error("Ports fetch error:", error)
      // Only show error toast if it's not a "no data" situation
      if (error?.message && !error.message.includes('404')) {
        toast.error("Failed to load ports")
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchOptions()
  }, [])

  React.useEffect(() => {
    fetchPorts()
  }, [hostDomainFilter, portFilter])

  // Client-side filtering
  const data = React.useMemo(() => {
    let filtered = [...allData]
    
    // Filter by host
    if (hostFilter) {
      filtered = filtered.filter(port => 
        port.host.toLowerCase().includes(hostFilter.toLowerCase())
      )
    }
    
    return filtered
  }, [allData, hostFilter])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("scan_type", "port")
    
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
      toast.success(`Port scan upload queued successfully! Job ID: ${result.data.jobId.slice(0, 8)}...`)
    } else {
      toast.success("Port scan upload successful!")
    }
    
    // Note: Don't refresh ports immediately as processing is async
    // The data will be available once the job completes
  }

  const columns: ColumnDef<Port>[] = [
    {
      accessorKey: "host",
      header: "Host",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.host}</span>
      ),
    },
    {
      accessorKey: "ip",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.ip}</span>
      ),
    },
    {
      accessorKey: "port",
      header: "Port",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">
          {row.original.port}
        </span>
      ),
    },
    {
      accessorKey: "protocol",
      header: "Protocol",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground uppercase">
          {row.original.protocol}
        </Badge>
      ),
    },
    {
      accessorKey: "tls",
      header: "TLS",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.tls
              ? "border-primary/30 bg-primary/10 text-primary"
              : "text-muted-foreground"
          }
        >
          {row.original.tls ? "Yes" : "No"}
        </Badge>
      ),
    },
  ]

  if (isLoading && allData.length === 0 && domainOptions.length === 0) {
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
        toolbar={
          <>
            <Select value={hostDomainFilter} onValueChange={setHostDomainFilter}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {domainOptions.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by host..."
              className="h-8 w-40"
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
            />
            <Select value={portFilter} onValueChange={setPortFilter}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Port" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ports</SelectItem>
                {portOptions.map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FileUploadDialog
              title="Upload Ports"
              description={`Upload an NDJSON file (naabu output).

Example format:
{"host":"sub.example.com","ip":"1.2.3.4","port":443,"protocol":"tcp","tls":true}`}
              accept=".json,.jsonl,.txt"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

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

interface Port {
  id: number
  host: string
  ip: string
  port: number
  protocol: string
  tls: boolean
}

export default function PortsPage() {
  const [allData, setAllData] = React.useState<Port[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [hostDomainFilter, setHostDomainFilter] = React.useState("")
  const [hostFilter, setHostFilter] = React.useState("")
  const [portFilter, setPortFilter] = React.useState("")

  const fetchPorts = async () => {
    setIsLoading(true)
    try {
      const res = await api.get<Port[]>("/api/ports")
      setAllData(Array.isArray(res.data) ? res.data : [])
    } catch (error: any) {
      // Only show error toast if it's not a "no data" situation
      if (error?.response?.status !== 404) {
        toast.error("Failed to load ports")
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchPorts()
  }, [])

  // Client-side filtering
  const data = React.useMemo(() => {
    let filtered = [...allData]
    
    // Filter by host domain (assuming host contains domain info)
    if (hostDomainFilter) {
      filtered = filtered.filter(port => 
        port.host.toLowerCase().includes(hostDomainFilter.toLowerCase())
      )
    }
    
    // Filter by host
    if (hostFilter) {
      filtered = filtered.filter(port => 
        port.host.toLowerCase().includes(hostFilter.toLowerCase())
      )
    }
    
    // Filter by port
    if (portFilter) {
      filtered = filtered.filter(port => 
        String(port.port).includes(portFilter)
      )
    }
    
    return filtered
  }, [allData, hostDomainFilter, hostFilter, portFilter])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    await api.upload("/api/ports", formData)
    fetchPorts()
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

  if (isLoading) {
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
            <Input
              placeholder="Filter by domain..."
              className="h-8 w-44"
              value={hostDomainFilter}
              onChange={(e) => setHostDomainFilter(e.target.value)}
            />
            <Input
              placeholder="Filter by host..."
              className="h-8 w-40"
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
            />
            <Input
              placeholder="Filter by port..."
              className="h-8 w-32"
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value)}
            />
            <FileUploadDialog
              title="Upload Ports"
              description="Upload a CSV file with format: host,ip,port,protocol,tls"
              accept=".csv"
              onUpload={handleUpload}
            />
          </>
        }
      />
    </div>
  )
}

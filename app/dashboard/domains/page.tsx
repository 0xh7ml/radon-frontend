"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconDotsVertical,
  IconLoader2,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/components/data-table"
import { FileUploadDialog } from "@/components/file-upload-dialog"

interface Domain {
  id: number
  name: string
  is_scanned: boolean
  createdAt: string
  updatedAt?: string
}

export default function DomainsPage() {
  const [allData, setAllData] = React.useState<Domain[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [editDomain, setEditDomain] = React.useState<Domain | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editScanned, setEditScanned] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [nameFilter, setNameFilter] = React.useState("")
  const [scannedFilter, setScannedFilter] = React.useState("")
  const [dateOrder, setDateOrder] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [itemsPerPage] = React.useState(20)

  const fetchDomains = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000", include_stats: "true" })
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/domains?${params.toString()}`, {
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
      console.log("Domains API response:", result)
      
      // Handle different response structures
      const items = result.data || result.items || (Array.isArray(result) ? result : [])
      setAllData(Array.isArray(items) ? items : [])
    } catch (error: any) {
      console.error("Domains fetch error:", error)
      // Only show error toast if it's not a "no data" situation
      if (error?.message && !error.message.includes('404')) {
        toast.error("Failed to load domains")
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDomains()
  }, [])

  // Client-side filtering and pagination
  const { data, totalPages } = React.useMemo(() => {
    let filtered = [...allData]
    
    // Filter by name
    if (nameFilter) {
      filtered = filtered.filter(domain => 
        domain.name.toLowerCase().includes(nameFilter.toLowerCase())
      )
    }
    
    // Filter by scanned status
    if (scannedFilter && scannedFilter !== "all") {
      const isScannedFilter = scannedFilter === "true"
      filtered = filtered.filter(domain => domain.is_scanned === isScannedFilter)
    }
    
    // Sort by date
    if (dateOrder) {
      filtered.sort((a, b) => {
        const dateA = new Date(dateOrder.includes("created") ? a.createdAt : a.updatedAt || a.createdAt)
        const dateB = new Date(dateOrder.includes("created") ? b.createdAt : b.updatedAt || b.createdAt)
        return dateOrder.includes("desc") ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
      })
    }
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage)
    
    return { data: paginatedData, totalPages }
  }, [allData, nameFilter, scannedFilter, dateOrder, page, itemsPerPage])

  const handleDelete = async (id: number) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/domains/${id}`, {
        method: 'DELETE',
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
      
      toast.success("Domain deleted")
      fetchDomains()
    } catch (error) {
      console.error("Domain delete error:", error)
      toast.error("Failed to delete domain")
    }
  }

  const handleEdit = (domain: Domain) => {
    setEditDomain(domain)
    setEditName(domain.name)
    setEditScanned(domain.is_scanned)
  }

  const handleSave = async () => {
    if (!editDomain) return
    setIsSaving(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/domains/${editDomain.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName,
          is_scanned: editScanned,
        })
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
      
      toast.success("Domain updated")
      setEditDomain(null)
      fetchDomains()
    } catch (error) {
      console.error("Domain update error:", error)
      toast.error("Failed to update domain")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("scan_type", "domain")
    
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
      toast.success(`Domain upload queued successfully! Job ID: ${result.data.jobId.slice(0, 8)}...`)
    } else {
      toast.success("Domain upload successful!")
    }
    
    // Refresh data after a short delay to allow processing
    setTimeout(() => {
      fetchDomains()
    }, 1000)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      // Handle the API date format "2026-02-12 18:01:15"
      const date = new Date(dateString.replace(' ', 'T'))
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    } catch {
      return dateString
    }
  }

  const columns: ColumnDef<Domain>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Domain Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "is_scanned",
      header: "Scanned",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.is_scanned
              ? "border-primary/30 bg-primary/10 text-primary"
              : "text-muted-foreground"
          }
        >
          {row.original.is_scanned ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <IconPencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              placeholder="Filter by name..."
              className="h-8 w-48"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <Select
              value={scannedFilter || "all"}
              onValueChange={setScannedFilter}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Scanned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Scanned</SelectItem>
                <SelectItem value="false">Not Scanned</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={dateOrder || "none"}
              onValueChange={setDateOrder}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Sort by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="createdAt_asc">Created (Oldest)</SelectItem>
                <SelectItem value="createdAt_desc">Created (Newest)</SelectItem>
                <SelectItem value="updatedAt_asc">Updated (Oldest)</SelectItem>
                <SelectItem value="updatedAt_desc">Updated (Newest)</SelectItem>
              </SelectContent>
            </Select>
            <FileUploadDialog
              title="Upload Domains"
              description="Upload a text file with one domain per line."
              accept=".txt"
              onUpload={handleUpload}
            />
          </>
        }
      />
      <Dialog
        open={!!editDomain}
        onOpenChange={(o) => !o && setEditDomain(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Domain Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editScanned} onCheckedChange={setEditScanned} />
              <Label>Scanned</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconLoader2, IconTrash } from "@tabler/icons-react"  
import { toast, alert } from "@/lib/sweetalert"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { FileUploadDialog } from "@/components/file-upload-dialog"

interface Subdomain {
  id: number
  name: string
  domain?: string
  domain_id?: number
  createdAt: string
}

interface PaginatedResponse {
  items?: Subdomain[]
  data?: Subdomain[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export default function SubdomainsPage() {
  const [allData, setAllData] = React.useState<Subdomain[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [itemsPerPage] = React.useState(20)
  const [domainFilter, setDomainFilter] = React.useState("")

  const fetchSubdomains = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000" })
      const res = await api.get<PaginatedResponse>(`/api/subdomains?${params.toString()}`)
      const resData = res.data
      const items = resData?.items || resData?.data || (Array.isArray(resData) ? resData : [])
      setAllData(Array.isArray(items) ? items : [])
    } catch (error: any) {
      // Only show error toast if it's not a "no data" situation
      if (error?.response?.status !== 404) {
        toast.error("Failed to load subdomains")
      }
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSubdomains()
  }, [])

  // Client-side filtering and pagination
  const { data, totalPages } = React.useMemo(() => {
    let filtered = [...allData]
    
    // Filter by domain
    if (domainFilter) {
      filtered = filtered.filter(subdomain => 
        subdomain.domain?.toLowerCase().includes(domainFilter.toLowerCase()) ||
        subdomain.name.toLowerCase().includes(domainFilter.toLowerCase())
      )
    }
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage)
    
    return { data: paginatedData, totalPages }
  }, [allData, domainFilter, page, itemsPerPage])

  const handleDelete = async (id: number) => {
    const result = await alert.delete(
      'Delete Subdomain',
      'This will permanently remove this subdomain from the database.'
    )
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/subdomains/${id}`)
        toast.success("Subdomain deleted successfully")
        fetchSubdomains()
      } catch {
        toast.error("Failed to delete subdomain")
      }
    }
  }

  const handleUpload = async (
    file: File,
    extraFields?: Record<string, string>
  ) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("scan_type", "subdomain")
    if (extraFields?.domain_id) {
      formData.append("domain_id", extraFields.domain_id)
    }
    await api.upload("/api/upload", formData)
    fetchSubdomains()
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

  const columns: ColumnDef<Subdomain>[] = [
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
      header: "Subdomain",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.domain || "-"}
        </span>
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
              placeholder="Filter by domain..."
              className="h-8 w-48"
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value)
                setPage(1)
              }}
            />
            <FileUploadDialog
              title="Upload Subdomains"
              description="Upload a plain text file (one subdomain per line) or NDJSON ({&quot;name&quot;: &quot;sub.example.com&quot;})."
              accept=".txt,.json,.jsonl"
              onUpload={handleUpload}
              extraFields={[
                {
                  key: "domain_id",
                  label: "Domain ID (optional)",
                  placeholder: "e.g., 1",
                },
              ]}
            />
          </>
        }
      />
    </div>
  )
}

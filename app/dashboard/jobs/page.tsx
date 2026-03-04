"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  IconClock,
  IconLoader2,
  IconRefresh,
  IconEye,
  IconCircleCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { JobStatusBadge } from "@/components/job-status-badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Job {
  id: number
  jobId: string
  fileName: string
  scanType: string
  status: string
  totalLines: number
  chunksQueued: number
  processedLines: number
  createdRecords: number
  skippedRecords: number
  failedRecords: number
  chunksProcessed: number
  completedAt?: string
  error?: string
  createdAt: string
  updatedAt: string
}

interface JobsApiResponse {
  success: boolean
  data: Job[]
  statusCode: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [pagination, setPagination] = React.useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null)
  const [statusFilter, setStatusFilter] = React.useState("")
  const [scanTypeFilter, setScanTypeFilter] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [itemsPerPage] = React.useState(20)

  const fetchJobs = async (pageNum = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: itemsPerPage.toString(),
      })
      
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      if (scanTypeFilter && scanTypeFilter !== "all") {
        params.append("scan_type", scanTypeFilter)
      }

      console.log("Fetching jobs with URL:", `/api/upload/jobs?${params.toString()}`)
      
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/upload/jobs?${params.toString()}`, {
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
      
      const res: JobsApiResponse = await response.json()
      console.log("Jobs API response:", res)
      
      // The API response has jobs directly in the data field
      const jobsData = res.data || []
      const paginationData = res.pagination || { page: 1, totalPages: 1, total: 0 }
      
      console.log("Extracted jobs:", jobsData)
      console.log("Extracted pagination:", paginationData)
      
      setJobs(Array.isArray(jobsData) ? jobsData : [])
      setPagination({
        page: paginationData.page,
        totalPages: paginationData.totalPages,
        total: paginationData.total,
      })
    } catch (error: any) {
      console.error("Jobs fetch error:", error)
      if (error?.response?.status !== 404) {
        toast.error("Failed to load jobs")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const retryJob = async (jobId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/upload/retry/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      toast.success("Job retry initiated")
      fetchJobs(page)
    } catch (error) {
      console.error("Retry job error:", error)
      toast.error("Failed to retry job")
    }
  }

  const refreshJobStatus = async (jobId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem('jwt_token') : null
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/upload/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const res: { success: boolean; data: Job } = await response.json()
      console.log("Single job response:", res)
      setSelectedJob(res.data)
      // Update the job in the list
      setJobs(prev => prev.map(job => 
        job.jobId === jobId ? res.data : job
      ))
    } catch (error) {
      console.error("Job refresh error:", error)
      toast.error("Failed to refresh job status")
    }
  }

  React.useEffect(() => {
    fetchJobs(page)
  }, [page, statusFilter, scanTypeFilter])

  // Client-side search filtering
  const filteredJobs = React.useMemo(() => {
    if (!searchQuery) return jobs
    return jobs.filter(job => 
      job.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [jobs, searchQuery])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString.replace(' ', 'T'))
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return dateString
    }
  }

  const formatProgress = (job: Job) => {
    if (job.totalLines === 0) return 0
    return Math.round((job.processedLines / job.totalLines) * 100)
  }

  const getScanTypeBadge = (scanType: string) => {
    const colors: Record<string, string> = {
      domain: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      subdomain: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      port: "bg-green-500/15 text-green-400 border-green-500/30",
      probed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      vulnerability: "bg-red-500/15 text-red-400 border-red-500/30",
    }
    return colors[scanType] || colors.domain
  }

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "fileName",
      header: "File",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.fileName}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.jobId.slice(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      accessorKey: "scanType",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${getScanTypeBadge(row.original.scanType)}`}
        >
          {row.original.scanType}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const job = row.original
        const progressPercent = formatProgress(job)
        return (
          <div className="w-24">
            <Progress value={progressPercent} className="h-2" />
            <div className="mt-1 text-xs text-muted-foreground text-center">
              {job.processedLines}/{job.totalLines}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "records",
      header: "Records",
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <IconCircleCheck className="h-3 w-3 text-green-500" />
              <span>{job.createdRecords}</span>
            </div>
            {job.skippedRecords > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <IconClock className="h-3 w-3" />
                <span>{job.skippedRecords}</span>
              </div>
            )}
            {job.failedRecords > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <IconAlertTriangle className="h-3 w-3" />
                <span>{job.failedRecords}</span>
              </div>
            )}
          </div>
        )
      },
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedJob(row.original)}
          >
            <IconEye className="h-4 w-4" />
            <span className="sr-only">View Details</span>
          </Button>
          {row.original.status === "failed" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => retryJob(row.original.jobId)}
            >
              <IconRefresh className="h-4 w-4" />
              <span className="sr-only">Retry</span>
            </Button>
          )}
        </div>
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
        data={filteredJobs}
        toolbar={
          <>
            <Input
              placeholder="Search jobs..."
              className="h-8 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              value={statusFilter || "all"}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={scanTypeFilter || "all"}
              onValueChange={setScanTypeFilter}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Scan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="subdomain">Subdomain</SelectItem>
                <SelectItem value="port">Port</SelectItem>
                <SelectItem value="probed">Probed</SelectItem>
                <SelectItem value="vulnerability">Vulnerability</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJobs(page)}
            >
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </>
        }
      />

      {/* Job Details Modal */}
      <Dialog
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Basic Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Job ID</span>
                      <p className="font-mono text-sm break-all">{selectedJob.jobId}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">File Name</span>
                      <p className="text-sm break-all">{selectedJob.fileName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Scan Type</span>
                      <p className="text-sm">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getScanTypeBadge(selectedJob.scanType)}`}
                        >
                          {selectedJob.scanType}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className="text-sm">
                        <JobStatusBadge status={selectedJob.status} />
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Total Lines</span>
                      <p className="text-sm">{selectedJob.totalLines.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Processed</span>
                      <p className="text-sm">{selectedJob.processedLines.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Chunks</span>
                      <p className="text-sm">{selectedJob.chunksProcessed}/{selectedJob.chunksQueued}</p>
                    </div>
                    <div>
                      <Progress value={formatProgress(selectedJob)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center sm:text-left">
                      <span className="text-xs text-muted-foreground block mb-1">Created Records</span>
                      <p className="text-lg font-semibold text-green-600">
                        {selectedJob.createdRecords.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-xs text-muted-foreground block mb-1">Skipped Records</span>
                      <p className="text-lg font-semibold text-orange-600">
                        {selectedJob.skippedRecords.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-xs text-muted-foreground block mb-1">Failed Records</span>
                      <p className="text-lg font-semibold text-red-600">
                        {selectedJob.failedRecords.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Timestamps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Created</span>
                      <p className="text-sm">{formatDate(selectedJob.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Updated</span>
                      <p className="text-sm">{formatDate(selectedJob.updatedAt)}</p>
                    </div>
                    {selectedJob.completedAt && (
                      <div>
                        <span className="text-xs text-muted-foreground">Completed</span>
                        <p className="text-sm">{formatDate(selectedJob.completedAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedJob.error && (
                <Card className="border-red-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-400">Error Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-300 bg-red-500/10 p-2 rounded break-words whitespace-pre-wrap">
                      {selectedJob.error}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshJobStatus(selectedJob.jobId)}
                  className="w-full sm:w-auto"
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                {selectedJob.status === "failed" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => retryJob(selectedJob.jobId)}
                    className="w-full sm:w-auto"
                  >
                    <IconRefresh className="h-4 w-4 mr-2" />
                    Retry Job
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconLoader2, IconPlus, IconTrash, IconCopy, IconKey } from "@tabler/icons-react"
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
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ApiToken {
  id: number
  name: string
  token?: string
  last_used_at: string | null
  createdAt: string
  is_active: boolean
}

export default function TokensPage() {
  const [tokens, setTokens] = React.useState<ApiToken[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [newTokenName, setNewTokenName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [createdToken, setCreatedToken] = React.useState<string | null>(null)

  const fetchTokens = async () => {
    try {
      setIsLoading(true)
      const res = await api.get<ApiToken[]>("/auth/tokens")
      setTokens(res.data)
    } catch {
      toast.error("Failed to load API tokens")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchTokens()
  }, [])

  const handleDelete = async (id: number, name: string) => {
    const result = await alert.delete(
      'Revoke API Token',
      `This will permanently revoke the token "${name}" and cannot be undone.`
    )
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/auth/tokens/${id}`)
        toast.success("API token revoked successfully")
        fetchTokens()
      } catch {
        toast.error("Failed to revoke API token")
      }
    }
  }

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      toast.error("Please enter a token name")
      return
    }

    try {
      setIsCreating(true)
      const payload = { name: newTokenName.trim() }

      const res = await api.post<{ token: string }>("/auth/tokens", payload)
      setCreatedToken(res.data.token)
      toast.success("API token created successfully")
      fetchTokens()
      setNewTokenName("")
    } catch {
      toast.error("Failed to create API token")
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      toast.success("Token copied to clipboard")
    } catch {
      toast.error("Failed to copy token")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    try {
      // Handle the API date format "2026-02-12 18:01:15"
      const date = new Date(dateString.replace(' ', 'T'))
      return date.toLocaleDateString("en-US", {
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

  const columns: ColumnDef<ApiToken>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "last_used_at",
      header: "Last Used",
      cell: ({ row }) => formatDate(row.getValue("last_used_at")),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
            ${isActive 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const token = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDelete(token.id, token.name)}
                className="text-red-600 dark:text-red-400"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Revoke
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-20">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">API Tokens</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage API tokens for programmatic access to your data.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create API Token</DialogTitle>
              <DialogDescription>
                Create a new API token for accessing the Radon API programmatically.
              </DialogDescription>
            </DialogHeader>
            
            {createdToken ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ This token will only be shown once. Please copy it now and store it securely.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Your API Token</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={createdToken}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(createdToken)}
                        >
                          <IconCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="token-name">Token Name *</Label>
                  <Input
                    id="token-name"
                    placeholder="e.g., monitoring-script, mobile-app"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              {createdToken ? (
                <Button onClick={() => {
                  setCreatedToken(null)
                  setIsCreateDialogOpen(false)
                }}>
                  Done
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateToken} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <IconKey className="mr-2 h-4 w-4" />
                        Create Token
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active API Tokens</CardTitle>
          <CardDescription>
            Manage your API tokens. Tokens that are expired or revoked cannot be used for API access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={tokens}
            searchPlaceholder="Search tokens..."
            searchKey="name"
          />
        </CardContent>
      </Card>
    </div>
  )
}
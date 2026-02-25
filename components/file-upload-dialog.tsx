"use client"

import * as React from "react"
import { IconLoader2, IconUpload } from "@tabler/icons-react"
import { toast } from "@/lib/sweetalert"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileUploadDialogProps {
  title: string
  description: string
  accept?: string
  onUpload: (file: File, extraFields?: Record<string, string>) => Promise<void>
  extraFields?: {
    key: string
    label: string
    placeholder?: string
  }[]
  trigger?: React.ReactNode
}

export function FileUploadDialog({
  title,
  description,
  accept,
  onUpload,
  extraFields,
  trigger,
}: FileUploadDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [fields, setFields] = React.useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file")
      return
    }
    setIsUploading(true)
    try {
      await onUpload(file, fields)
      toast.success("Upload successful")
      setOpen(false)
      setFile(null)
      setFields({})
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <IconUpload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept={accept}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {extraFields?.map((field) => (
              <div key={field.key} className="flex flex-col gap-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={fields[field.key] || ""}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading && (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

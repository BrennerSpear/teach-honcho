"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/AlertDialog"
import type { FileValidationResult } from "~/lib/fileUtils"

interface FileValidationWarningProps {
  validation: FileValidationResult | null
  onProceed: () => void
  onCancel: () => void
  open: boolean
}

export function FileValidationWarning({
  validation,
  onProceed,
  onCancel,
  open,
}: FileValidationWarningProps) {
  if (!validation || validation.sizeCategory === "safe") {
    return null
  }

  const getWarningContent = () => {
    switch (validation.sizeCategory) {
      case "warning":
        return {
          title: "Medium File Size Detected",
          description: `This file is ${validation.sizeInMB.toFixed(1)}MB. Processing should complete normally, but may take a moment.`,
          severity: "warning" as const,
        }
      case "large":
        return {
          title: "Large File Size Warning",
          description: `This file is ${validation.sizeInMB.toFixed(1)}MB. Processing may take significant time and memory. Consider splitting large files for better performance.`,
          severity: "warning" as const,
        }
      case "too_large":
        return {
          title: "File Too Large",
          description: `This file is ${validation.sizeInMB.toFixed(1)}MB, which exceeds the 100MB limit. Please split the file into smaller chunks before uploading.`,
          severity: "error" as const,
        }
      default:
        return null
    }
  }

  const content = getWarningContent()
  if (!content) return null

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription>{content.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {content.severity === "error" ? (
            <AlertDialogAction onClick={onCancel}>
              Choose Different File
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onProceed}>
                Process Anyway
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

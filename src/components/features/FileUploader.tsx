"use client"

import { useCallback, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { LoadingSpinner } from "~/components/ui/LoadingSpinner"
import type { ProcessedChat } from "~/core/chatProcessor"
import { useFileProcessor } from "~/hooks/useFileProcessor"
import {
  type FileValidationResult,
  formatFileSize,
  validateFile,
} from "~/lib/fileUtils"
import { cn } from "~/lib/utils"
import { FileValidationWarning } from "./FileValidationWarning"

interface FileUploaderProps {
  onFileProcessed?: (data: {
    success: boolean
    data?: ProcessedChat | ProcessedChat[]
    error?: string
    warning?: string
  }) => void
  className?: string
}

export function FileUploader({
  onFileProcessed,
  className,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] =
    useState<FileValidationResult | null>(null)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const { isProcessing, error, processFile, reset } = useFileProcessor()

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set inactive if we're leaving the drop zone entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return

      const file = files[0]
      if (!file) return

      await handleFileSelection(file)
    },
    [processFile, onFileProcessed],
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file) return

      await handleFileSelection(file)
    },
    [processFile, onFileProcessed],
  )

  const processFileDirectly = useCallback(
    async (file: File) => {
      setSelectedFile(file)
      const result = await processFile(file)
      // Ensure warning is undefined instead of null for type compatibility
      const processedResult = {
        ...result,
        warning: result.warning || undefined,
      }
      onFileProcessed?.(processedResult)
    },
    [processFile, onFileProcessed],
  )

  const handleFileSelection = useCallback(
    async (file: File) => {
      reset()

      // Validate file first
      const validation = validateFile(file)
      setValidationResult(validation)

      if (!validation.valid) {
        const result = { success: false, error: validation.error }
        onFileProcessed?.(result)
        return
      }

      // Show warning dialog for large files
      if (validation.sizeCategory !== "safe") {
        setPendingFile(file)
        setShowWarningDialog(true)
        return
      }

      // Process file immediately for safe sizes
      await processFileDirectly(file)
    },
    [reset, onFileProcessed, processFileDirectly],
  )

  const handleWarningProceed = useCallback(async () => {
    setShowWarningDialog(false)
    if (pendingFile) {
      await processFileDirectly(pendingFile)
      setPendingFile(null)
    }
  }, [pendingFile, processFileDirectly])

  const handleWarningCancel = useCallback(() => {
    setShowWarningDialog(false)
    setPendingFile(null)
    setValidationResult(null)
  }, [])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setPendingFile(null)
    setValidationResult(null)
    setShowWarningDialog(false)
    reset()
  }, [reset])

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          {
            "border-primary bg-primary/5": isDragActive,
            "border-muted-foreground/25 hover:border-muted-foreground/50":
              !isDragActive && !selectedFile,
            "border-green-500 bg-green-50": selectedFile && !error,
            "border-red-500 bg-red-50": error,
          },
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Drop ChatGPT export file here or click to browse"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            const input = e.currentTarget.querySelector(
              'input[type="file"]',
            ) as HTMLInputElement
            input?.click()
          }
        }}
      >
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          {!selectedFile && !isProcessing && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground text-lg">
                  Drop your ChatGPT export here
                </p>
                <p className="text-muted-foreground text-sm">
                  or click to browse for a JSON file
                </p>
              </div>
              <div className="text-muted-foreground text-xs">
                <p>Supports files up to 100MB</p>
                <p>Warning shown for files over 50MB</p>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="space-y-3">
              <LoadingSpinner size="lg" className="mx-auto" />
              <div>
                <p className="font-medium text-lg">Processing file...</p>
                <p className="text-muted-foreground text-sm">
                  {selectedFile &&
                    `${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
                </p>
              </div>
            </div>
          )}

          {selectedFile && !isProcessing && !error && (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800 text-lg">
                  File processed successfully!
                </p>
                <p className="text-green-600 text-sm">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Processing Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reset Button */}
      {(selectedFile || error) && !isProcessing && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleReset}>
            Upload Another File
          </Button>
        </div>
      )}

      {/* File Validation Warning Dialog */}
      <FileValidationWarning
        validation={validationResult}
        onProceed={handleWarningProceed}
        onCancel={handleWarningCancel}
        open={showWarningDialog}
      />
    </div>
  )
}

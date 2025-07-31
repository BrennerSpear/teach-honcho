"use client"

import { useCallback, useState } from "react"
import type { ProcessedChat } from "~/core/chatProcessor"
import { api } from "~/utils/api"

export interface BatchUploadItem {
  id: string
  chat: ProcessedChat
  sessionId?: string
  metadata?: Record<string, unknown>
}

export interface BatchUploadProgress {
  totalBatches: number
  completedBatches: number
  failedBatches: number
  currentBatch?: string
  isUploading: boolean
  progress: number // 0-100
  errors: Array<{ id: string; error: string }>
  results: Array<{
    id: string
    success: boolean
    sessionId?: string
    messagesCount?: number
    uploadedAt?: string
  }>
}

export interface UseBatchUploadOptions {
  apiKey: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  batchSize?: number // Number of chats to upload in each batch
  onProgress?: (progress: BatchUploadProgress) => void
  onComplete?: (progress: BatchUploadProgress) => void
  onError?: (error: string) => void
}

export function useBatchUpload(options: UseBatchUploadOptions) {
  const [progress, setProgress] = useState<BatchUploadProgress>({
    totalBatches: 0,
    completedBatches: 0,
    failedBatches: 0,
    isUploading: false,
    progress: 0,
    errors: [],
    results: [],
  })

  const batchUploadMutation = api.chat.batchUploadChats.useMutation()

  const updateProgress = useCallback(
    (updates: Partial<BatchUploadProgress>) => {
      setProgress((prev) => {
        const newProgress = { ...prev, ...updates }
        options.onProgress?.(newProgress)
        return newProgress
      })
    },
    [options],
  )

  const uploadBatch = useCallback(
    async (items: BatchUploadItem[]) => {
      if (!options.apiKey || items.length === 0) {
        throw new Error("API key required and items cannot be empty")
      }

      const chatBatches = items.map((item) => ({
        id: item.id,
        messages: item.chat.messages,
        sessionId: item.sessionId,
        metadata: item.metadata,
      }))

      const result = await batchUploadMutation.mutateAsync({
        chatBatches,
        apiKey: options.apiKey,
        workspaceId: options.workspaceId,
        environment: options.environment,
      })

      return result
    },
    [batchUploadMutation, options],
  )

  const startBatchUpload = useCallback(
    async (items: BatchUploadItem[]) => {
      if (items.length === 0) {
        options.onError?.("No items to upload")
        return
      }

      const batchSize = options.batchSize || 10
      const totalBatches = Math.ceil(items.length / batchSize)

      // Initialize progress
      updateProgress({
        totalBatches,
        completedBatches: 0,
        failedBatches: 0,
        isUploading: true,
        progress: 0,
        errors: [],
        results: [],
      })

      const allResults: BatchUploadProgress["results"] = []
      const allErrors: BatchUploadProgress["errors"] = []

      try {
        for (let i = 0; i < totalBatches; i++) {
          const startIndex = i * batchSize
          const endIndex = Math.min(startIndex + batchSize, items.length)
          const batchItems = items.slice(startIndex, endIndex)

          const batchId = `batch-${i + 1}`
          updateProgress({
            currentBatch: batchId,
            progress: Math.round((i / totalBatches) * 100),
          })

          try {
            const result = await uploadBatch(batchItems)

            // Add results from this batch
            allResults.push(...result.results)
            allErrors.push(...result.errors)

            updateProgress({
              completedBatches: i + 1,
              failedBatches: allErrors.length > 0 ? 1 : 0,
              results: allResults,
              errors: allErrors,
              progress: Math.round(((i + 1) / totalBatches) * 100),
            })

            // Add delay between batches to prevent rate limiting
            if (i < totalBatches - 1) {
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Batch upload failed"

            // Add error for all items in this batch
            const batchErrors = batchItems.map((item) => ({
              id: item.id,
              error: errorMessage,
            }))

            allErrors.push(...batchErrors)

            updateProgress({
              failedBatches: allErrors.length,
              errors: allErrors,
            })
          }
        }

        const finalProgress: BatchUploadProgress = {
          totalBatches,
          completedBatches: totalBatches,
          failedBatches: allErrors.length > 0 ? 1 : 0,
          isUploading: false,
          progress: 100,
          errors: allErrors,
          results: allResults,
        }

        updateProgress(finalProgress)
        options.onComplete?.(finalProgress)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Batch upload failed"

        updateProgress({
          isUploading: false,
        })

        options.onError?.(errorMessage)
      }
    },
    [options, updateProgress, uploadBatch],
  )

  const reset = useCallback(() => {
    setProgress({
      totalBatches: 0,
      completedBatches: 0,
      failedBatches: 0,
      isUploading: false,
      progress: 0,
      errors: [],
      results: [],
    })
  }, [])

  return {
    progress,
    startBatchUpload,
    reset,
    isUploading: progress.isUploading,
  }
}

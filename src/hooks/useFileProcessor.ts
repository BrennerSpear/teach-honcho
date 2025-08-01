"use client"

import { useCallback, useState } from "react"
import { processChatData, validateChatGPTExport } from "~/core"
import type { ProcessedChat } from "~/core/chatProcessor"

interface ProcessingState {
  isProcessing: boolean
  error: string | null
  processedChats: ProcessedChat | ProcessedChat[] | null
  originalChatCount: number
}

const MAX_FILE_SIZE_MB = 100
const WARNING_FILE_SIZE_MB = 50

export function useFileProcessor() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    processedChats: null,
    originalChatCount: 0,
  })

  const validateFileSize = useCallback((file: File) => {
    const sizeInMB = file.size / (1024 * 1024)

    if (sizeInMB > MAX_FILE_SIZE_MB) {
      return {
        valid: false,
        error: `File size (${sizeInMB.toFixed(1)}MB) exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB. Please split the file into smaller chunks.`,
        warning: null,
      }
    }

    if (sizeInMB > WARNING_FILE_SIZE_MB) {
      return {
        valid: true,
        error: null,
        warning: `Large file detected (${sizeInMB.toFixed(1)}MB). Processing may take some time and use significant memory.`,
      }
    }

    return {
      valid: true,
      error: null,
      warning: null,
    }
  }, [])

  const processFile = useCallback(
    async (file: File) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        processedChats: null,
      }))

      try {
        // Validate file size
        const sizeValidation = validateFileSize(file)
        if (!sizeValidation.valid) {
          throw new Error(sizeValidation.error || "File validation failed")
        }

        // Read file content
        const text = await file.text()
        let jsonData: unknown

        try {
          jsonData = JSON.parse(text)
        } catch (_parseError) {
          throw new Error(
            "Invalid JSON file. Please ensure the file is properly formatted.",
          )
        }

        // Validate ChatGPT export format
        const validation = validateChatGPTExport(jsonData)
        if (!validation.valid) {
          throw new Error(
            `Invalid ChatGPT export format: ${validation.message}`,
          )
        }

        // Process the chat data
        const result = processChatData(jsonData)
        if (!result.success) {
          throw new Error(result.message)
        }

        if (!result.data) {
          throw new Error("No data returned from processing")
        }

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          processedChats: result.data || null,
          originalChatCount: Array.isArray(result.data)
            ? result.data.length
            : 1,
        }))

        return {
          success: true,
          data: result.data,
          warning: sizeValidation.warning,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred"
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }))

        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [validateFileSize],
  )

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      processedChats: null,
      originalChatCount: 0,
    })
  }, [])

  return {
    ...state,
    processFile,
    validateFileSize,
    reset,
  }
}

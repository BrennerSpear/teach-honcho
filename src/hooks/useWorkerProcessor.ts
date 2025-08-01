"use client"

import { useCallback, useRef } from "react"
import type { ProcessedChat } from "~/core/chatProcessor"
import type {
  WorkerMessage,
  WorkerResponse,
} from "~/workers/chatProcessor.worker"

interface WorkerProcessorResult {
  success: boolean
  data?: ProcessedChat | ProcessedChat[]
  error?: string
}

export function useWorkerProcessor() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRequests = useRef<
    Map<string, (result: WorkerProcessorResult) => void>
  >(new Map())

  const initializeWorker = useCallback(() => {
    if (workerRef.current) return

    try {
      // Create worker from the worker file
      workerRef.current = new Worker(
        new URL("~/workers/chatProcessor.worker.ts", import.meta.url),
        { type: "module" },
      )

      // Handle worker messages
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload } = event.data
        const { id } = payload
        const resolve = pendingRequests.current.get(id)

        if (!resolve) return

        switch (type) {
          case "PROCESS_CHAT_DATA_SUCCESS":
            resolve({
              success: true,
              data: payload.result,
            })
            break
          case "PROCESS_CHAT_DATA_ERROR":
            resolve({
              success: false,
              error: payload.error,
            })
            break
        }

        // Clean up the pending request
        pendingRequests.current.delete(id)
      }

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error)
        // Reject all pending requests
        for (const [_id, resolve] of pendingRequests.current) {
          resolve({
            success: false,
            error: "Worker encountered an error",
          })
        }
        pendingRequests.current.clear()
      }
    } catch (error) {
      console.error("Failed to initialize worker:", error)
    }
  }, [])

  const processInWorker = useCallback(
    (jsonData: unknown): Promise<WorkerProcessorResult> => {
      return new Promise((resolve) => {
        // Fallback to synchronous processing if worker fails
        if (!workerRef.current) {
          initializeWorker()
          if (!workerRef.current) {
            // Import and use synchronous processing as fallback
            import("~/core").then(
              ({ processChatData, validateChatGPTExport }) => {
                try {
                  const validation = validateChatGPTExport(jsonData)
                  if (!validation.valid) {
                    resolve({
                      success: false,
                      error: `Invalid ChatGPT export format: ${validation.message}`,
                    })
                    return
                  }

                  const result = processChatData(jsonData)
                  if (!result.success) {
                    resolve({
                      success: false,
                      error: result.message,
                    })
                    return
                  }

                  resolve({
                    success: true,
                    data: result.data,
                  })
                } catch (error) {
                  resolve({
                    success: false,
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  })
                }
              },
            )
            return
          }
        }

        // Generate unique ID for this request
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Store the resolve function
        pendingRequests.current.set(id, resolve)

        // Send message to worker
        const message: WorkerMessage = {
          type: "PROCESS_CHAT_DATA",
          payload: {
            id,
            jsonData,
          },
        }

        workerRef.current.postMessage(message)
      })
    },
    [initializeWorker],
  )

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    pendingRequests.current.clear()
  }, [])

  return {
    processInWorker,
    terminateWorker,
    isWorkerSupported: typeof Worker !== "undefined",
  }
}

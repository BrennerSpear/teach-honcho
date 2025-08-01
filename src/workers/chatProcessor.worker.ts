// Web Worker for processing large ChatGPT JSON files
// This prevents the main thread from blocking during heavy JSON operations

import { processChatData, validateChatGPTExport } from "~/core"
import type { ProcessedChat } from "~/core/chatProcessor"

export interface WorkerMessage {
  type: "PROCESS_CHAT_DATA"
  payload: {
    id: string
    jsonData: unknown
  }
}

export interface WorkerResponse {
  type: "PROCESS_CHAT_DATA_SUCCESS" | "PROCESS_CHAT_DATA_ERROR"
  payload: {
    id: string
    result?: ProcessedChat
    error?: string
  }
}

// Handle messages from the main thread
self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  switch (type) {
    case "PROCESS_CHAT_DATA":
      handleProcessChatData(payload)
      break
    default:
      console.error("Unknown worker message type:", type)
  }
})

async function handleProcessChatData({
  id,
  jsonData,
}: WorkerMessage["payload"]) {
  try {
    // Validate ChatGPT export format
    const validation = validateChatGPTExport(jsonData)
    if (!validation.valid) {
      throw new Error(`Invalid ChatGPT export format: ${validation.message}`)
    }

    // Process the chat data
    const result = processChatData(jsonData)

    console.log("[Worker] Chat data processed:", {
      success: result.success,
      hasData: !!result.data,
      dataType: Array.isArray(result.data) ? "array" : "single",
      data: result.data,
    })

    if (!result.success) {
      throw new Error(result.message)
    }

    // Send success response
    const response: WorkerResponse = {
      type: "PROCESS_CHAT_DATA_SUCCESS",
      payload: {
        id,
        result: result.data,
      },
    }

    self.postMessage(response)
  } catch (error) {
    // Send error response
    const response: WorkerResponse = {
      type: "PROCESS_CHAT_DATA_ERROR",
      payload: {
        id,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
    }

    self.postMessage(response)
  }
}

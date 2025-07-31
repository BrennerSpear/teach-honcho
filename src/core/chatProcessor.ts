import type { UnknownJsonData } from "../types/chat"
import { type ChatJSON, extractVisibleMessages } from "../utils/extractMessages"

/**
 * Pure JSON processing functions - no file system operations
 * Perfect for frontend/Lambda usage
 */

export interface ProcessedChat {
  messages: Array<{ author: string; content: string }>
  messageCount: number
  originalFormat: "array" | "chatgpt"
}

export interface ProcessChatResult {
  success: boolean
  message: string
  data?: ProcessedChat
}

/**
 * Processes raw ChatGPT export JSON data into clean message format
 * Pure function - no file system operations
 */
export function processChatData(jsonData: UnknownJsonData): ProcessChatResult {
  try {
    let messages: Array<{ author: string; content: string }>
    let originalFormat: "array" | "chatgpt"

    // Handle both array format and ChatJSON format
    if (Array.isArray(jsonData)) {
      // Already in the format we need
      messages = jsonData
      originalFormat = "array"
    } else {
      // Extract messages using the utility function
      messages = extractVisibleMessages(jsonData as ChatJSON)
      originalFormat = "chatgpt"
    }

    if (messages.length === 0) {
      return {
        success: false,
        message: "No messages found in the data",
      }
    }

    return {
      success: true,
      message: `Successfully processed ${messages.length} messages`,
      data: {
        messages,
        messageCount: messages.length,
        originalFormat,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to process chat data: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Validates that JSON data looks like a ChatGPT export
 */
export function validateChatGPTExport(jsonData: UnknownJsonData): {
  valid: boolean
  message: string
} {
  if (!jsonData || typeof jsonData !== "object") {
    return { valid: false, message: "Data must be a JSON object" }
  }

  // Check for ChatGPT export structure
  if (
    typeof jsonData === "object" &&
    "mapping" in jsonData &&
    typeof (jsonData as { mapping?: unknown }).mapping === "object"
  ) {
    return { valid: true, message: "Valid ChatGPT export format" }
  }

  // Check for array of messages
  if (Array.isArray(jsonData)) {
    const hasValidMessages = jsonData.some(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.author === "string" &&
        typeof item.content === "string",
    )

    if (hasValidMessages) {
      return { valid: true, message: "Valid message array format" }
    }

    return {
      valid: false,
      message: "Array does not contain valid message objects",
    }
  }

  return { valid: false, message: "Unrecognized chat format" }
}

import type { UnknownJsonData } from "../types/chat"
import { type ChatJSON, extractVisibleMessages } from "../utils/extractMessages"

/**
 * Pure JSON processing functions - no file system operations
 * Perfect for frontend/Lambda usage
 */

interface MessageItem {
  author?: string
  content?: string
  role?: string
  from?: string
  text?: string
}

interface ChatGPTConversation {
  mapping: object
}

export interface ProcessedChat {
  messages: Array<{ author: string; content: string }>
  messageCount: number
  originalFormat: "array" | "chatgpt"
  title?: string
  create_time?: number
}

export interface ProcessChatResult {
  success: boolean
  message: string
  data?: ProcessedChat | ProcessedChat[]
}

/**
 * Processes raw ChatGPT export JSON data into clean message format
 * Pure function - no file system operations
 */
export function processChatData(jsonData: UnknownJsonData): ProcessChatResult {
  try {
    let messages: Array<{ author: string; content: string }>
    let originalFormat: "array" | "chatgpt"
    let chatTitle: string | undefined
    let chatCreateTime: number | undefined

    // Handle different input formats
    if (Array.isArray(jsonData)) {
      const firstItem = jsonData[0]

      // Check if array contains ChatGPT conversation objects
      if (
        firstItem &&
        typeof firstItem === "object" &&
        "mapping" in firstItem &&
        typeof (firstItem as ChatGPTConversation).mapping === "object"
      ) {
        // Process array of ChatGPT conversation objects - each conversation separately
        const conversationResults: ProcessedChat[] = []
        for (const chatObject of jsonData) {
          const extracted = extractVisibleMessages(chatObject as ChatJSON)
          if (extracted.messages.length > 0) {
            conversationResults.push({
              messages: extracted.messages,
              messageCount: extracted.messages.length,
              originalFormat: "chatgpt",
              title: extracted.title,
              create_time: extracted.create_time,
            })
          }
        }

        if (conversationResults.length === 0) {
          return {
            success: false,
            message: "No messages found in any conversations",
          }
        }

        return {
          success: true,
          message: `Successfully processed ${conversationResults.length} conversations with ${conversationResults.reduce((total, conv) => total + conv.messageCount, 0)} total messages`,
          data: conversationResults,
        }
      } else {
        // Process array of direct message objects
        messages = jsonData.map((item: MessageItem) => {
          if (!item || typeof item !== "object") {
            throw new Error("Invalid message item in array")
          }

          // Support different property name formats
          let author: string
          let content: string

          if (
            typeof item.author === "string" &&
            typeof item.content === "string"
          ) {
            author = item.author
            content = item.content
          } else if (
            typeof item.role === "string" &&
            typeof item.content === "string"
          ) {
            author = item.role
            content = item.content
          } else if (
            typeof item.from === "string" &&
            typeof item.text === "string"
          ) {
            author = item.from
            content = item.text
          } else {
            throw new Error(
              `Message item missing required properties. Found keys: [${Object.keys(item).join(", ")}]`,
            )
          }

          return { author, content }
        })
        originalFormat = "array"
      }
    } else {
      // Extract messages from single ChatGPT conversation object
      const extracted = extractVisibleMessages(jsonData as ChatJSON)
      messages = extracted.messages
      originalFormat = "chatgpt"
      chatTitle = extracted.title
      chatCreateTime = extracted.create_time
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
        title: chatTitle,
        create_time: chatCreateTime,
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

  // Check for ChatGPT export structure first (single conversation object)
  if (
    typeof jsonData === "object" &&
    "mapping" in jsonData &&
    typeof (jsonData as { mapping?: unknown }).mapping === "object"
  ) {
    return { valid: true, message: "Valid ChatGPT export format" }
  }

  // Check for array of messages or ChatGPT conversation objects
  if (Array.isArray(jsonData)) {
    if (jsonData.length === 0) {
      return {
        valid: false,
        message: "Array is empty",
      }
    }

    const firstItem = jsonData[0]

    // Check if array contains ChatGPT conversation objects (with mapping structure)
    if (
      firstItem &&
      typeof firstItem === "object" &&
      "mapping" in firstItem &&
      typeof (firstItem as ChatGPTConversation).mapping === "object"
    ) {
      return {
        valid: true,
        message: "Valid array of ChatGPT conversation objects",
      }
    }

    // Check for direct message objects (simple array format)
    const hasValidMessages = jsonData.some(
      (item) =>
        item &&
        typeof item === "object" &&
        ((typeof (item as MessageItem).author === "string" &&
          typeof (item as MessageItem).content === "string") ||
          (typeof (item as MessageItem).role === "string" &&
            typeof (item as MessageItem).content === "string") ||
          (typeof (item as MessageItem).from === "string" &&
            typeof (item as MessageItem).text === "string")),
    )

    if (hasValidMessages) {
      return { valid: true, message: "Valid message array format" }
    }

    // Provide more detailed error information
    const itemKeys =
      firstItem && typeof firstItem === "object" ? Object.keys(firstItem) : []

    return {
      valid: false,
      message: `Array does not contain valid message objects or ChatGPT conversation objects. First item has keys: [${itemKeys.join(", ")}]. Expected either ChatGPT objects (with 'mapping') or message objects with 'author'+'content', 'role'+'content', or 'from'+'text'.`,
    }
  }

  return { valid: false, message: "Unrecognized chat format" }
}

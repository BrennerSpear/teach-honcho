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

    // Handle different input formats
    if (Array.isArray(jsonData)) {
      const firstItem = jsonData[0]
      
      // Check if array contains ChatGPT conversation objects
      if (
        firstItem &&
        typeof firstItem === "object" &&
        "mapping" in firstItem &&
        typeof (firstItem as any).mapping === "object"
      ) {
        // Process array of ChatGPT conversation objects - each conversation separately
        const conversationResults: ProcessedChat[] = []
        for (const chatObject of jsonData) {
          const chatMessages = extractVisibleMessages(chatObject as ChatJSON)
          if (chatMessages.length > 0) {
            conversationResults.push({
              messages: chatMessages,
              messageCount: chatMessages.length,
              originalFormat: "chatgpt",
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
        messages = jsonData.map((item: any) => {
          if (!item || typeof item !== "object") {
            throw new Error("Invalid message item in array")
          }
          
          // Support different property name formats
          let author: string
          let content: string
          
          if (typeof item.author === "string" && typeof item.content === "string") {
            author = item.author
            content = item.content
          } else if (typeof item.role === "string" && typeof item.content === "string") {
            author = item.role
            content = item.content
          } else if (typeof item.from === "string" && typeof item.text === "string") {
            author = item.from
            content = item.text
          } else {
            throw new Error(`Message item missing required properties. Found keys: [${Object.keys(item).join(', ')}]`)
          }
          
          return { author, content }
        })
        originalFormat = "array"
      }
    } else {
      // Extract messages from single ChatGPT conversation object
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
      typeof (firstItem as any).mapping === "object"
    ) {
      return { valid: true, message: "Valid array of ChatGPT conversation objects" }
    }

    // Check for direct message objects (simple array format)
    const hasValidMessages = jsonData.some(
      (item) =>
        item &&
        typeof item === "object" &&
        ((typeof (item as any).author === "string" && typeof (item as any).content === "string") ||
         (typeof (item as any).role === "string" && typeof (item as any).content === "string") ||
         (typeof (item as any).from === "string" && typeof (item as any).text === "string"))
    )

    if (hasValidMessages) {
      return { valid: true, message: "Valid message array format" }
    }

    // Provide more detailed error information
    const itemKeys = firstItem && typeof firstItem === "object" ? Object.keys(firstItem) : []
    
    return {
      valid: false,
      message: `Array does not contain valid message objects or ChatGPT conversation objects. First item has keys: [${itemKeys.join(', ')}]. Expected either ChatGPT objects (with 'mapping') or message objects with 'author'+'content', 'role'+'content', or 'from'+'text'.`,
    }
  }

  return { valid: false, message: "Unrecognized chat format" }
}

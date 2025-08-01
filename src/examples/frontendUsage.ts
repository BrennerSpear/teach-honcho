/**
 * Example usage of the pure services from frontend/Lambda/API routes
 * These functions work with JSON data only - no file system dependencies
 */

import {
  getWorkingRepresentation,
  processChatData,
  uploadMessagesToHoncho,
  validateChatGPTExport,
} from "../core"
import type {
  ApiRequest,
  ApiResponse,
  ChatExportItem,
  UnknownJsonData,
} from "../types/chat"

// Example 1: Process ChatGPT export JSON directly (perfect for Lambda)
export async function handleChatUpload(jsonData: UnknownJsonData) {
  // Validate the data first
  const validation = validateChatGPTExport(jsonData)
  if (!validation.valid) {
    throw new Error(validation.message)
  }

  // Process the chat data (pure function - no file operations)
  const result = processChatData(jsonData)

  if (!result.success) {
    throw new Error(result.message)
  }

  const data = result.data
  if (Array.isArray(data)) {
    // Handle array of ProcessedChat - combine all messages
    const allMessages = data.flatMap((chat) => chat.messages)
    const totalCount = data.reduce((sum, chat) => sum + chat.messageCount, 0)
    return {
      messages: allMessages,
      messagesCount: totalCount,
      originalFormat: data[0]?.originalFormat,
    }
  } else {
    // Handle single ProcessedChat
    return {
      messages: data?.messages,
      messagesCount: data?.messageCount,
      originalFormat: data?.originalFormat,
    }
  }
}

// Example 2: Upload messages directly to Honcho (pure function)
export async function uploadChatMessages(
  messages: Array<{ author: string; content: string }>,
  sessionId?: string,
  apiKey?: string,
) {
  const result = await uploadMessagesToHoncho({
    messages,
    sessionId,
    apiKey,
  })

  if (!result.success) {
    throw new Error(result.message)
  }

  return {
    sessionId: result.sessionId,
    messagesCount: result.messagesCount,
    uniqueAuthors: result.uniqueAuthors,
  }
}

// Example 3: Complete pipeline from JSON to Honcho (perfect for API routes)
export async function processAndUploadChat(
  jsonData: UnknownJsonData,
  sessionId?: string,
  apiKey?: string,
) {
  // Step 1: Process the JSON data
  const processResult = processChatData(jsonData)
  if (!processResult.success) {
    throw new Error(`Processing failed: ${processResult.message}`)
  }

  // Step 2: Upload to Honcho
  const data = processResult.data
  let messagesToUpload: Array<{ author: string; content: string }>
  let messageCount: number
  let originalFormat: "array" | "chatgpt" | undefined

  if (Array.isArray(data)) {
    // Handle array of ProcessedChat - combine all messages
    messagesToUpload = data.flatMap((chat) => chat.messages)
    messageCount = data.reduce((sum, chat) => sum + chat.messageCount, 0)
    originalFormat = data[0]?.originalFormat
  } else if (data?.messages) {
    // Handle single ProcessedChat
    messagesToUpload = data.messages
    messageCount = data.messageCount
    originalFormat = data.originalFormat
  } else {
    throw new Error("No messages found after processing")
  }

  const uploadResult = await uploadMessagesToHoncho({
    messages: messagesToUpload,
    sessionId,
    apiKey,
  })

  if (!uploadResult.success) {
    throw new Error(`Upload failed: ${uploadResult.message}`)
  }

  return {
    processedMessages: messageCount,
    originalFormat: originalFormat,
    sessionId: uploadResult.sessionId,
    uniqueAuthors: uploadResult.uniqueAuthors,
  }
}

// Example 4: Get working representation (pure function)
export async function getRepresentationForUser(
  peerId: string,
  targetPeerId?: string,
  apiKey?: string,
) {
  const result = await getWorkingRepresentation({
    peerId,
    targetPeerId,
    apiKey,
  })

  if (!result.success) {
    throw new Error(result.message || "Failed to get representation")
  }

  return result.representation
}

// Example 5: Process multiple chat exports (perfect for batch API endpoints)
export async function processBatchChats(
  chatExports: ChatExportItem[],
  onProgress?: (completed: number, total: number, currentId: string) => void,
) {
  const results = []

  for (let i = 0; i < chatExports.length; i++) {
    const exportItem = chatExports[i]
    if (!exportItem) continue
    const { id, data } = exportItem

    try {
      const result = processChatData(data)
      const processedData = result.data
      let messages: Array<{ author: string; content: string }> | undefined
      let messageCount: number | undefined

      if (Array.isArray(processedData)) {
        // Handle array of ProcessedChat - combine all messages
        messages = processedData.flatMap((chat) => chat.messages)
        messageCount = processedData.reduce(
          (sum, chat) => sum + chat.messageCount,
          0,
        )
      } else if (processedData) {
        // Handle single ProcessedChat
        messages = processedData.messages
        messageCount = processedData.messageCount
      }

      results.push({
        id,
        success: result.success,
        messages,
        messageCount,
        error: result.success ? undefined : result.message,
      })

      onProgress?.(i + 1, chatExports.length, id)
    } catch (error) {
      results.push({
        id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      onProgress?.(i + 1, chatExports.length, id)
    }
  }

  return results
}

// Example 6: Next.js API route example
export async function apiRouteExample(req: ApiRequest, res: ApiResponse) {
  try {
    const { chatData, sessionId } = req.body

    // Validate input
    if (!chatData) {
      return res.status(400).json({ error: "chatData is required" })
    }

    // Process and upload in one go
    const result = await processAndUploadChat(
      chatData,
      sessionId,
      process.env.HONCHO_API_KEY,
    )

    res.json({
      success: true,
      ...result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

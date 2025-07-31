import { processChatData } from "~/core"
import type { ProcessedChat } from "~/core/chatProcessor"

export interface ChunkProcessingOptions {
  chunkSize?: number
  onProgress?: (processed: number, total: number) => void
  onChunkComplete?: (chunkIndex: number, result: ProcessedChat) => void
}

export interface ChunkProcessingResult {
  success: boolean
  data?: ProcessedChat
  error?: string
  totalChunks?: number
  processedChunks?: number
}

/**
 * Process large arrays of chat data in chunks to prevent memory issues
 * and provide progress feedback
 */
export async function processInChunks(
  chatArray: unknown[],
  options: ChunkProcessingOptions = {},
): Promise<ChunkProcessingResult> {
  const {
    chunkSize = 100, // Process 100 chats at a time
    onProgress,
    onChunkComplete,
  } = options

  if (!Array.isArray(chatArray)) {
    return {
      success: false,
      error: "Input must be an array for chunked processing",
    }
  }

  const totalItems = chatArray.length
  const totalChunks = Math.ceil(totalItems / chunkSize)

  const processedMessages: Array<{ author: string; content: string }> = []
  let processedChunks = 0

  try {
    for (let i = 0; i < totalChunks; i++) {
      const startIndex = i * chunkSize
      const endIndex = Math.min(startIndex + chunkSize, totalItems)
      const chunk = chatArray.slice(startIndex, endIndex)

      // Process this chunk
      const chunkResult = processChatData(chunk)
      if (!chunkResult.success || !chunkResult.data) {
        return {
          success: false,
          error: `Failed to process chunk ${i + 1}: ${chunkResult.message}`,
          totalChunks,
          processedChunks,
        }
      }

      // Accumulate messages from this chunk
      processedMessages.push(...chunkResult.data.messages)
      processedChunks++

      // Notify about chunk completion
      onChunkComplete?.(i, chunkResult.data)

      // Update progress
      const processedItems = Math.min(endIndex, totalItems)
      onProgress?.(processedItems, totalItems)

      // Yield control to prevent blocking the main thread
      if (i < totalChunks - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    const finalResult: ProcessedChat = {
      messages: processedMessages,
      messageCount: processedMessages.length,
      originalFormat: "array",
    }

    return {
      success: true,
      data: finalResult,
      totalChunks,
      processedChunks,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during chunked processing",
      totalChunks,
      processedChunks,
    }
  }
}

/**
 * Estimate memory usage for a JSON object
 */
export function estimateMemoryUsage(data: unknown): number {
  try {
    const jsonString = JSON.stringify(data)
    // Rough estimate: JSON string size * 2 (for parsing overhead)
    return jsonString.length * 2
  } catch {
    return 0
  }
}

/**
 * Check if chunked processing is recommended based on data size
 */
export function shouldUseChunkedProcessing(data: unknown): boolean {
  const estimatedSize = estimateMemoryUsage(data)
  // Recommend chunked processing for data over 50MB
  return estimatedSize > 50 * 1024 * 1024
}

/**
 * Split a large array into optimal chunks based on memory constraints
 */
export function calculateOptimalChunkSize(
  _arrayLength: number,
  averageItemSize: number,
): number {
  // Target ~10MB per chunk
  const targetChunkSize = 10 * 1024 * 1024
  const itemsPerChunk = Math.floor(targetChunkSize / averageItemSize)

  // Ensure reasonable bounds
  return Math.max(10, Math.min(itemsPerChunk, 1000))
}

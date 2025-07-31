import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { processChatData } from "../core/chatProcessor"
import { uploadMessagesToHoncho } from "../core/honchoClient"

export interface HonchoUploadOptions {
  filePath?: string
  messages?: Array<{ author: string; content: string }>
  apiKey?: string
  workspaceId?: string
  sessionId?: string
  environment?: "local" | "production" | "demo"
  moveToProcessed?: boolean
  skipIfProcessed?: boolean
}

export interface HonchoUploadResult {
  success: boolean
  message: string
  sessionId?: string
  messagesCount?: number
  skipped?: boolean
  movedTo?: string
}

/**
 * Uploads messages from a cleaned chat JSON file or in-memory data to Honcho.
 * File-based wrapper around the pure uploadMessagesToHoncho function.
 */
export async function uploadChatToHoncho(
  options: HonchoUploadOptions,
): Promise<HonchoUploadResult> {
  let messages: Array<{ author: string; content: string }>
  let filePath = ""
  let sessionId = options.sessionId

  // Handle in-memory messages (no file operations)
  if (options.messages) {
    const uploadResult = await uploadMessagesToHoncho({
      messages: options.messages,
      sessionId: options.sessionId,
      apiKey: options.apiKey,
      workspaceId: options.workspaceId,
      environment: options.environment,
    })

    return {
      success: uploadResult.success,
      message: uploadResult.message,
      sessionId: uploadResult.sessionId,
      messagesCount: uploadResult.messagesCount,
      skipped: false,
    }
  }

  // Handle file-based messages
  if (!options.filePath) {
    return {
      success: false,
      message: "Either filePath or messages must be provided",
    }
  }

  // Try different possible paths for the file
  const possiblePaths = [
    options.filePath,
    join("chats/clean", options.filePath),
    join("clean", options.filePath),
  ]

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      filePath = path
      break
    }
  }

  if (!filePath) {
    return {
      success: false,
      message: `File not found: ${options.filePath}`,
    }
  }

  // Check if file is already processed
  if (options.skipIfProcessed !== false) {
    const processedDir = join(dirname(filePath), "..", "processed")
    const processedPath = join(processedDir, basename(filePath))

    if (existsSync(processedPath)) {
      return {
        success: true,
        message: `File already processed`,
        skipped: true,
      }
    }
  }

  // Read and parse the JSON file
  try {
    const jsonContent = readFileSync(filePath, "utf-8")
    const parsedData = JSON.parse(jsonContent)

    // Use pure processor
    const processResult = processChatData(parsedData)

    if (!processResult.success) {
      return {
        success: false,
        message: processResult.message,
      }
    }

    if (!processResult.data?.messages) {
      return {
        success: false,
        message: "No messages found after processing",
      }
    }

    messages = processResult.data.messages
  } catch (error) {
    return {
      success: false,
      message: `Failed to read or parse file: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }

  // Generate session ID from filename if not provided
  if (!sessionId) {
    sessionId = basename(options.filePath)
      .replace(/\.json$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
  }

  try {
    // Use pure upload function
    const uploadResult = await uploadMessagesToHoncho({
      messages,
      sessionId,
      apiKey: options.apiKey,
      workspaceId: options.workspaceId,
      environment: options.environment,
    })

    if (!uploadResult.success) {
      // Move file to error folder on failure
      if (options.moveToProcessed !== false) {
        const errorDir = join(dirname(filePath), "..", "error")

        if (!existsSync(errorDir)) {
          mkdirSync(errorDir, { recursive: true })
        }

        const errorPath = join(errorDir, basename(filePath))
        renameSync(filePath, errorPath)

        return {
          success: false,
          message: uploadResult.message,
          movedTo: errorPath,
        }
      }

      return uploadResult
    }

    let movedTo: string | undefined

    // Move file to processed folder after successful upload
    if (options.moveToProcessed !== false) {
      const processedDir = join(dirname(filePath), "..", "processed")

      if (!existsSync(processedDir)) {
        mkdirSync(processedDir, { recursive: true })
      }

      const processedPath = join(processedDir, basename(filePath))
      renameSync(filePath, processedPath)
      movedTo = processedPath
    }

    return {
      success: true,
      message: uploadResult.message,
      sessionId: uploadResult.sessionId,
      messagesCount: uploadResult.messagesCount,
      movedTo,
    }
  } catch (error) {
    // Move file to error folder on failure
    if (options.moveToProcessed !== false) {
      try {
        const errorDir = join(dirname(filePath), "..", "error")

        if (!existsSync(errorDir)) {
          mkdirSync(errorDir, { recursive: true })
        }

        const errorPath = join(errorDir, basename(filePath))
        renameSync(filePath, errorPath)

        return {
          success: false,
          message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          movedTo: errorPath,
        }
      } catch (_moveError) {
        return {
          success: false,
          message: `Upload failed and couldn't move to error folder: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    }

    return {
      success: false,
      message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

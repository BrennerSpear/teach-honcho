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

    // Check if this is a cleaned file with new format (has messages, title, create_time)
    if (
      parsedData &&
      typeof parsedData === "object" &&
      "messages" in parsedData
    ) {
      // New cleaned format: { messages: [...], title: "...", create_time: ... }
      messages = parsedData.messages
      if (!Array.isArray(messages)) {
        return {
          success: false,
          message: "Invalid cleaned file format: messages is not an array",
        }
      }

      // Generate session ID from title and create_time if not provided
      if (!sessionId) {
        const { title, create_time } = parsedData
        console.log("[HonchoUploader] Parsed data:", {
          title,
          create_time,
          hasMessages: !!parsedData.messages,
          messageCount: parsedData.messages?.length,
        })
        if (title && create_time) {
          // Format: title-create_time
          const cleanTitle = title
            .replace(/[^a-zA-Z0-9-_\s]/g, "")
            .replace(/\s+/g, "-")
          // Remove decimal from timestamp to match Honcho's pattern
          const timestamp = Math.floor(create_time)
          sessionId = `${cleanTitle}-${timestamp}`
          console.log(
            "[HonchoUploader] Generated session ID from title and timestamp:",
            {
              originalTitle: title,
              cleanTitle,
              create_time,
              sessionId,
            },
          )
        } else {
          // Fallback to filename-based ID
          sessionId = basename(options.filePath)
            .replace(/\.json$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "-")
          console.log(
            "[HonchoUploader] Fallback to filename-based session ID:",
            {
              filename: basename(options.filePath),
              sessionId,
              reason: !title ? "Missing title" : "Missing create_time",
            },
          )
        }
      }
    } else {
      // Old format or raw ChatGPT export - use processor
      const processResult = processChatData(parsedData)

      if (!processResult.success) {
        return {
          success: false,
          message: processResult.message,
        }
      }

      // The uploader only handles single conversations, not arrays
      if (Array.isArray(processResult.data)) {
        return {
          success: false,
          message:
            "Uploader cannot handle multiple conversations. Please use the batch processor.",
        }
      }

      const processedData = processResult.data
      if (!processedData?.messages) {
        return {
          success: false,
          message: "No messages found after processing",
        }
      }

      messages = processedData.messages

      // Generate session ID from title and create_time if not provided
      if (!sessionId) {
        const { title, create_time } = processedData
        console.log("[HonchoUploader] Processed data (old format):", {
          title,
          create_time,
          hasMessages: !!processedData.messages,
          messageCount: processedData.messages?.length,
        })
        if (title && create_time) {
          // Format: title-create_time
          const cleanTitle = title
            .replace(/[^a-zA-Z0-9-_\s]/g, "")
            .replace(/\s+/g, "-")
          // Remove decimal from timestamp to match Honcho's pattern
          const timestamp = Math.floor(create_time)
          sessionId = `${cleanTitle}-${timestamp}`
          console.log(
            "[HonchoUploader] Generated session ID from title and timestamp:",
            {
              originalTitle: title,
              cleanTitle,
              create_time,
              sessionId,
            },
          )
        } else {
          // Fallback to filename-based ID
          sessionId = basename(options.filePath)
            .replace(/\.json$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "-")
          console.log(
            "[HonchoUploader] Fallback to filename-based session ID:",
            {
              filename: basename(options.filePath),
              sessionId,
              reason: !title ? "Missing title" : "Missing create_time",
            },
          )
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to read or parse file: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }

  try {
    // Use pure upload function
    console.log("[HonchoUploader] Uploading to Honcho:", {
      sessionId,
      messageCount: messages.length,
      workspaceId: options.workspaceId || "teach-honcho",
      environment: options.environment || "production",
    })
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

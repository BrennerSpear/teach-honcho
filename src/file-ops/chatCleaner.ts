import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { processChatData } from "../core/chatProcessor"

export interface CleanChatOptions {
  inputPath: string
  outputPath: string
}

export interface CleanChatResult {
  success: boolean
  message: string
  messagesCount?: number
  outputPath?: string
}

/**
 * Cleans a ChatGPT export JSON file by extracting visible messages
 * and removing metadata and Unicode artifacts.
 */
export async function cleanChatFile(
  options: CleanChatOptions,
): Promise<CleanChatResult> {
  try {
    const fileContent = await readFile(options.inputPath, "utf8")
    const json = JSON.parse(fileContent)

    // Use the pure chat processor
    const processResult = processChatData(json)

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

    const messages = processResult.data.messages

    // Ensure output directory exists
    await mkdir(resolve(options.outputPath, ".."), { recursive: true })

    await writeFile(
      options.outputPath,
      JSON.stringify(messages, null, 2),
      "utf8",
    )

    return {
      success: true,
      message: `Successfully cleaned chat file`,
      messagesCount: messages.length,
      outputPath: options.outputPath,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Convenience function for cleaning a file from raw to clean directory
 */
export async function cleanChatFromRaw(
  fileName: string,
): Promise<CleanChatResult> {
  const inputPath = resolve("chats", "raw", fileName)
  const outputPath = resolve("chats", "clean", fileName)

  return cleanChatFile({ inputPath, outputPath })
}

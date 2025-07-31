import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

export interface BatchOptions {
  startIndex?: number
  endIndex?: number
  dryRun?: boolean
}

export interface BatchFile {
  index: number
  filename: string
  path: string
}

export interface BatchResult<T> {
  totalFiles: number
  processedFiles: BatchFile[]
  results: T[]
  summary: {
    total: number
    success: number
    error: number
    skipped: number
  }
}

/**
 * Gets a list of JSON files from a directory with optional index filtering
 */
export function getBatchFiles(
  directory: string,
  options: BatchOptions = {},
): BatchFile[] {
  if (!existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`)
  }

  // Get all JSON files and sort them
  const files = readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort()

  if (files.length === 0) {
    return []
  }

  // Apply index bounds
  const startIdx = options.startIndex ?? 0
  const endIdx = options.endIndex ?? files.length - 1

  // Validate indices
  if (startIdx < 0 || startIdx >= files.length) {
    throw new Error(
      `Invalid start index: ${startIdx}. Must be between 0 and ${files.length - 1}`,
    )
  }

  if (endIdx < startIdx || endIdx >= files.length) {
    throw new Error(
      `Invalid end index: ${endIdx}. Must be between ${startIdx} and ${files.length - 1}`,
    )
  }

  // Create batch files array
  const batchFiles: BatchFile[] = []
  for (let i = startIdx; i <= endIdx; i++) {
    const filename = files[i]
    if (filename) {
      batchFiles.push({
        index: i,
        filename,
        path: join(directory, filename),
      })
    }
  }

  return batchFiles
}

/**
 * Processes a batch of files with a given processor function
 */
export async function processBatch<T>(
  files: BatchFile[],
  processor: (file: BatchFile) => Promise<T>,
  options: { dryRun?: boolean } = {},
): Promise<BatchResult<T>> {
  const results: T[] = []
  let successCount = 0
  let errorCount = 0
  let skipCount = 0

  for (const file of files) {
    if (options.dryRun) {
      // In dry run, we don't actually process
      continue
    }

    try {
      const result = await processor(file)
      results.push(result)

      // Count success/skip based on result structure
      if (typeof result === "object" && result !== null) {
        const resultObj = result as { success?: boolean; skipped?: boolean }
        if (resultObj.success === false) {
          errorCount++
        } else if (resultObj.skipped === true) {
          skipCount++
        } else {
          successCount++
        }
      } else {
        successCount++
      }
    } catch (error) {
      errorCount++
      // Add error result
      results.push({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      } as T)
    }
  }

  return {
    totalFiles: files.length,
    processedFiles: files,
    results,
    summary: {
      total: files.length,
      success: successCount,
      error: errorCount,
      skipped: skipCount,
    },
  }
}

// Removed getNextBatchSuggestion - replaced with context-aware suggestions in CLI scripts

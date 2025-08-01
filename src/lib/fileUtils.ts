export const FILE_SIZE_LIMITS = {
  MAX_SIZE_MB: 200,
  WARNING_SIZE_MB: 100,
  SAFE_SIZE_MB: 10,
} as const

export const ALLOWED_FILE_TYPES = ["application/json", "text/json"] as const

export interface FileValidationResult {
  valid: boolean
  error?: string
  warning?: string
  sizeCategory: "safe" | "warning" | "large" | "too_large"
  sizeInMB: number
}

export function validateFile(file: File): FileValidationResult {
  const sizeInMB = file.size / (1024 * 1024)

  // Check file type
  if (
    !ALLOWED_FILE_TYPES.includes(
      file.type as (typeof ALLOWED_FILE_TYPES)[number],
    )
  ) {
    // Also check file extension as fallback
    if (!file.name.toLowerCase().endsWith(".json")) {
      return {
        valid: false,
        error: "Please select a JSON file (.json)",
        sizeCategory: "safe",
        sizeInMB,
      }
    }
  }

  // Check file size
  if (sizeInMB > FILE_SIZE_LIMITS.MAX_SIZE_MB) {
    return {
      valid: false,
      error: `File size (${sizeInMB.toFixed(1)}MB) exceeds maximum limit of ${FILE_SIZE_LIMITS.MAX_SIZE_MB}MB. Please split the file into smaller chunks.`,
      sizeCategory: "too_large",
      sizeInMB,
    }
  }

  let sizeCategory: FileValidationResult["sizeCategory"] = "safe"
  let warning: string | undefined

  if (sizeInMB > FILE_SIZE_LIMITS.WARNING_SIZE_MB) {
    sizeCategory = "large"
    warning = `Large file detected (${sizeInMB.toFixed(1)}MB). Processing may take some time and use significant memory.`
  } else if (sizeInMB > FILE_SIZE_LIMITS.SAFE_SIZE_MB) {
    sizeCategory = "warning"
    warning = `Medium-sized file (${sizeInMB.toFixed(1)}MB). Processing should complete normally.`
  }

  return {
    valid: true,
    warning,
    sizeCategory,
    sizeInMB,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`
}

export function isValidJsonFile(file: File): boolean {
  return (
    ALLOWED_FILE_TYPES.includes(
      file.type as (typeof ALLOWED_FILE_TYPES)[number],
    ) || file.name.toLowerCase().endsWith(".json")
  )
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        resolve(result)
      } else {
        reject(new Error("Failed to read file as text"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    reader.readAsText(file)
  })
}

export function createChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

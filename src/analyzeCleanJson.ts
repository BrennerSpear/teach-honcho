import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { analyzeUnicode } from "./utils/analyzeUnicode"

/**
 * Creates a regex pattern for special characters to avoid biome control character warnings
 */
function createSpecialCharsRegex(): RegExp {
  // Control characters and special Unicode ranges
  const ranges = [
    String.fromCharCode(0, 8), // \u0000-\u0008
    String.fromCharCode(11, 12), // \u000B-\u000C
    String.fromCharCode(14, 31), // \u000E-\u001F
    String.fromCharCode(127, 159), // \u007F-\u009F
    String.fromCharCode(8203, 8207), // \u200B-\u200F
    String.fromCharCode(8232, 8239), // \u2028-\u202F
    String.fromCharCode(8287, 8303), // \u205F-\u206F
    String.fromCharCode(65279), // \uFEFF
    String.fromCharCode(65529, 65531), // \uFFF9-\uFFFB
    String.fromCharCode(57344, 63743), // \uE000-\uF8FF private use
  ]

  const pattern = ranges
    .map((range) => {
      if (range.length === 1)
        return `\\u{${range.charCodeAt(0).toString(16).padStart(4, "0")}}`
      return `\\u{${range.charCodeAt(0).toString(16).padStart(4, "0")}}-\\u{${range
        .charCodeAt(range.length - 1)
        .toString(16)
        .padStart(4, "0")}}`
    })
    .join("")

  return new RegExp(`[${pattern}]`, "u")
}

import { type ChatJSON, extractVisibleMessages } from "./utils/extractMessages"

// Get filename from command line arguments
const filename = process.argv[2]

if (!filename) {
  console.error("Usage: pnpm analyze:chat <filename>")
  console.error(
    "Example: pnpm analyze:chat 168thStreetArmoryHistory_1743599522.json",
  )
  process.exit(1)
}

// Try different possible paths
const possiblePaths = [
  filename, // exact path provided
  join("chats/clean", filename), // in chats/clean directory
  join("clean", filename), // in clean directory
]

let filePath = ""
for (const path of possiblePaths) {
  if (existsSync(path)) {
    filePath = path
    break
  }
}

if (!filePath) {
  console.error(`Error: File not found: ${filename}`)
  console.error("Searched in:")
  possiblePaths.forEach((p) => console.error(`  - ${p}`))
  process.exit(1)
}

try {
  // Read the JSON file
  const jsonContent = readFileSync(filePath, "utf-8")
  const parsedData = JSON.parse(jsonContent)

  // Debug: Check the structure
  console.log("\nDebug - File structure:")
  console.log("- Top level keys:", Object.keys(parsedData).slice(0, 5))

  // Check if it's an array of messages directly
  if (Array.isArray(parsedData)) {
    console.log(`- File contains an array with ${parsedData.length} items`)
    if (parsedData.length > 0) {
      console.log("- First item structure:", Object.keys(parsedData[0]))
      console.log(
        "- First item:",
        `${JSON.stringify(parsedData[0], null, 2).substring(0, 200)}...`,
      )
    }

    // If it's already an array of messages, analyze them directly
    console.log(`\nAnalyzing ${parsedData.length} messages from ${filePath}\n`)

    parsedData.forEach(
      (msg: { author?: string; content?: string }, index: number) => {
        console.log(`\n${"=".repeat(80)}`)
        console.log(`MESSAGE ${index + 1} (${msg.author || "unknown"})`)
        console.log("=".repeat(80))

        const content = msg.content || ""
        console.log(
          `\nContent preview: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"\n`,
        )

        // Analyze Unicode characters
        analyzeUnicode(content)

        // Check if this message has any special characters
        const specialCharsPattern = createSpecialCharsRegex()
        if (specialCharsPattern.test(content)) {
          console.log(
            "\n⚠️  This message contains special characters that need cleaning!",
          )
        }
      },
    )

    process.exit(0)
  }

  // Otherwise, try as ChatJSON format
  const chatData: ChatJSON = parsedData
  const extracted = extractVisibleMessages(chatData)
  const messages = extracted.messages

  console.log(`\nAnalyzing ${messages.length} messages from ${filePath}\n`)

  // Analyze each message
  messages.forEach((msg, index) => {
    console.log(`\n${"=".repeat(80)}`)
    console.log(`MESSAGE ${index + 1} (${msg.author})`)
    console.log("=".repeat(80))

    // Show first 100 chars of the message
    console.log(
      `\nContent preview: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? "..." : ""}"\n`,
    )

    // Analyze Unicode characters
    analyzeUnicode(msg.content)

    // Check if this message has any special characters
    const specialCharsPattern = createSpecialCharsRegex()
    if (specialCharsPattern.test(msg.content)) {
      console.log(
        "\n⚠️  This message contains special characters that need cleaning!",
      )
    }
  })
} catch (error) {
  console.error(`Error reading or processing file: ${error}`)
  process.exit(1)
}

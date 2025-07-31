import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { type ChatJSON, extractVisibleMessages } from "./utils/extractMessages"
import { analyzeUnicode } from "./utils/analyzeUnicode"

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
  possiblePaths.forEach(p => console.error(`  - ${p}`))
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
      console.log("- First item:", JSON.stringify(parsedData[0], null, 2).substring(0, 200) + "...")
    }
    
    // If it's already an array of messages, analyze them directly
    console.log(`\nAnalyzing ${parsedData.length} messages from ${filePath}\n`)
    
    parsedData.forEach((msg: any, index: number) => {
      console.log(`\n${"=".repeat(80)}`)
      console.log(`MESSAGE ${index + 1} (${msg.author || 'unknown'})`)
      console.log("=".repeat(80))
      
      const content = msg.content || ""
      console.log(
        `\nContent preview: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"\n`,
      )
      
      // Analyze Unicode characters
      analyzeUnicode(content)
      
      // Check if this message has any special characters
      const specialCharsPattern =
        /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF\uFFF9-\uFFFB\uE000-\uF8FF]/
      if (specialCharsPattern.test(content)) {
        console.log(
          "\n⚠️  This message contains special characters that need cleaning!",
        )
      }
    })
    
    process.exit(0)
  }
  
  // Otherwise, try as ChatJSON format
  const chatData: ChatJSON = parsedData
  const messages = extractVisibleMessages(chatData)

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
    const specialCharsPattern =
      /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF\uFFF9-\uFFFB\uE000-\uF8FF]/
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

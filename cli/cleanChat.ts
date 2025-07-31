#!/usr/bin/env tsx
import { cleanChatFromRaw } from "../src/file-ops/chatCleaner"

async function main() {
  const rawFileName = process.argv[2]

  if (!rawFileName || rawFileName === "--help" || rawFileName === "-h") {
    console.log(`
📚 Clean Chat File

Usage: pnpm clean:chat <rawFileName.json>

Description:
  Cleans a ChatGPT export JSON file by extracting visible messages
  and removing metadata and Unicode artifacts.

Arguments:
  rawFileName.json    The JSON file to clean from chats/raw directory

Examples:
  pnpm clean:chat conversation_export.json
  pnpm clean:chat MyChat_1234567890.json

Notes:
  - Input file must be in chats/raw directory
  - Output will be saved to chats/clean directory
  - Only user and assistant messages are extracted
  - Hidden messages and metadata are removed
`)
    process.exit(rawFileName ? 0 : 1)
  }

  try {
    const result = await cleanChatFromRaw(rawFileName)

    if (result.success) {
      console.log(`✅ ${result.message}`)
      console.log(`   Messages: ${result.messagesCount}`)
      console.log(`   Output: ${result.outputPath}`)
    } else {
      console.error(`❌ ${result.message}`)
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    process.exit(1)
  }
}

main()

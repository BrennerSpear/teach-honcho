#!/usr/bin/env tsx
import { uploadChatToHoncho } from "../src/file-ops/honchoUploader"

async function main() {
  const filename = process.argv[2]

  if (!filename || filename === "--help" || filename === "-h") {
    console.log(`
📤 Upload Chat to Honcho

Usage: pnpm upload:chat <filename.json>

Description:
  Uploads a cleaned chat JSON file to Honcho AI platform.
  Creates peers for each unique author and adds all messages to a session.

Arguments:
  filename.json    The cleaned JSON file to upload from chats/clean directory

Examples:
  pnpm upload:chat conversation_export.json
  pnpm upload:chat MyChat_1234567890.json

Notes:
  - Input file should be in chats/clean directory (or provide full path)
  - Successfully uploaded files are moved to chats/processed
  - Failed uploads are moved to chats/error
  - Already processed files are automatically skipped
  - Requires HONCHO_API_KEY environment variable
`)
    process.exit(filename ? 0 : 1)
  }

  try {
    const result = await uploadChatToHoncho({
      filePath: filename,
      moveToProcessed: true,
      skipIfProcessed: true,
    })

    if (result.success) {
      if (result.skipped) {
        console.log(`⏭️  Skipping ${filename} - already processed`)
        if (result.movedTo) {
          console.log(`   File exists at: ${result.movedTo}`)
        }
      } else {
        console.log(`Creating session: ${result.sessionId}`)
        console.log(`Adding ${result.messagesCount} messages to session...`)
        console.log(`✅ ${result.message}`)
        console.log(`Upload complete!`)
        if (result.movedTo) {
          console.log(`✅ Moved file to: ${result.movedTo}`)
        }
      }
    } else {
      console.error(`❌ Upload failed for ${filename}`)
      console.error(`   ${result.message}`)
      if (result.movedTo) {
        console.log(`❌ Moved file to error folder: ${result.movedTo}`)
      }
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    process.exit(1)
  }
}

main()

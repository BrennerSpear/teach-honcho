#!/usr/bin/env ts-node
import fs from "node:fs/promises"
import path from "node:path"
import { extractVisibleMessages } from "../src/utils/extractMessages"

async function main() {
  const rawFileName = process.argv[2]
  if (!rawFileName) {
    console.error("Usage: pnpm run clean:chat <rawFileName.json>")
    process.exit(1)
  }

  // Resolve paths relative to the project root (assumed to be current working directory)
  const rawPath = path.resolve("chats", "raw", rawFileName)
  const cleanDir = path.resolve("chats", "clean")
  const cleanPath = path.join(cleanDir, rawFileName)

  try {
    const fileContent = await fs.readFile(rawPath, "utf8")
    const json = JSON.parse(fileContent)
    const messages = extractVisibleMessages(json)

    await fs.mkdir(cleanDir, { recursive: true })
    await fs.writeFile(cleanPath, JSON.stringify(messages, null, 2), "utf8")

    console.log(`✅ Cleaned chat written to ${cleanPath}`)
  } catch (err) {
    console.error("❌ Failed to process file:", err)
    process.exit(1)
  }
}

main()

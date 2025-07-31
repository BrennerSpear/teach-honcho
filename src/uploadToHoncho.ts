import { readFileSync, existsSync, mkdirSync, renameSync } from "node:fs"
import { join, basename, dirname } from "node:path"
import { Honcho, type Peer } from "@honcho-ai/sdk"
import { extractVisibleMessages } from "./utils/extractMessages"

interface UploadOptions {
  apiKey?: string
  workspaceId?: string
  sessionId?: string
  environment?: "local" | "production" | "demo"
}

/**
 * Uploads messages from a cleaned chat JSON file to Honcho.
 * Creates peers for each unique author and adds all messages to a session.
 *
 * @param filename - The path to the cleaned JSON file
 * @param options - Configuration options for the upload
 * @returns Promise that resolves when upload is complete
 */
export async function uploadChatToHoncho(
  filename: string,
  options: UploadOptions = {},
): Promise<void> {
  // Try different possible paths for the file
  const possiblePaths = [
    filename,
    join("chats/clean", filename),
    join("clean", filename),
  ]

  let filePath = ""
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      filePath = path
      break
    }
  }

  if (!filePath) {
    throw new Error(`File not found: ${filename}`)
  }

  // Check if file is already processed
  const processedDir = join(dirname(filePath), "..", "processed")
  const processedPath = join(processedDir, basename(filePath))
  
  if (existsSync(processedPath)) {
    console.log(`⏭️  Skipping ${basename(filePath)} - already processed`)
    console.log(`   File exists at: ${processedPath}`)
    return
  }

  // Read and parse the JSON file
  const jsonContent = readFileSync(filePath, "utf-8")
  const parsedData = JSON.parse(jsonContent)

  // Handle both array format and ChatJSON format
  let messages: Array<{ author: string; content: string }>

  if (Array.isArray(parsedData)) {
    // Already in the format we need
    messages = parsedData
  } else {
    // Extract messages using the utility function
    messages = extractVisibleMessages(parsedData)
  }

  if (messages.length === 0) {
    console.log("No messages found in the file")
    return
  }

  try {
    // Initialize Honcho client
    const honcho = new Honcho({
      apiKey: options.apiKey || process.env.HONCHO_API_KEY,
      workspaceId: options.workspaceId || "teach-honcho",
      environment: options.environment || "production",
    })

    // Generate session ID from filename if not provided
    const sessionId =
      options.sessionId ||
      filename.replace(/\.json$/, "").replace(/[^a-zA-Z0-9-_]/g, "-")

    console.log(`Creating session: ${sessionId}`)
    const session = honcho.session(sessionId)

    // Create peers for unique authors
    const uniqueAuthors = [...new Set(messages.map((m) => m.author))]
    const peers: Record<string, Peer> = {}

    console.log(
      `Creating ${uniqueAuthors.length} peers: ${uniqueAuthors.join(", ")}`,
    )
    for (const author of uniqueAuthors) {
      peers[author] = honcho.peer(author)
    }

    // Add peers to session
    await session.addPeers(Object.values(peers))

    // Create messages and add to session
    console.log(`Adding ${messages.length} messages to session...`)
    const honchoMessages = messages.map((msg) => {
      const peer = peers[msg.author]
      if (!peer) {
        throw new Error(`No peer found for author: ${msg.author}`)
      }
      return peer.message(msg.content)
    })

    // Add all messages to the session
    await session.addMessages(honchoMessages)

    console.log(
      `Successfully uploaded ${messages.length} messages to Honcho session: ${sessionId}`,
    )

    // Optionally wait for deriver processing to complete
    // console.log("Waiting for message processing to complete...")
    // await honcho.pollDeriverStatus({ sessionId, timeoutMs: 60000 })

    console.log("Upload complete!")

    // Move file to processed folder after successful upload
    const processedDir = join(dirname(filePath), "..", "processed")

    // Create processed directory if it doesn't exist
    if (!existsSync(processedDir)) {
      mkdirSync(processedDir, { recursive: true })
    }

    // Move the file
    const processedPath = join(processedDir, basename(filePath))
    renameSync(filePath, processedPath)
    console.log(`✅ Moved file to: ${processedPath}`)
  } catch (error) {
    // Move file to error folder on failure
    console.error(`❌ Upload failed for ${filename}`)
    
    const errorDir = join(dirname(filePath), "..", "error")
    
    // Create error directory if it doesn't exist
    if (!existsSync(errorDir)) {
      mkdirSync(errorDir, { recursive: true })
    }
    
    // Move the file to error folder
    const errorPath = join(errorDir, basename(filePath))
    renameSync(filePath, errorPath)
    console.log(`❌ Moved file to error folder: ${errorPath}`)
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const filename = process.argv[2]

  if (!filename) {
    console.error("Usage: tsx src/uploadToHoncho.ts <filename>")
    console.error(
      "Example: tsx src/uploadToHoncho.ts 168thStreetArmoryHistory_1743599522.json",
    )
    process.exit(1)
  }

  uploadChatToHoncho(filename).catch((error) => {
    // Error is already logged in the function, just exit with error code
    process.exit(1)
  })
}

import { Honcho, type Peer } from "@honcho-ai/sdk"

/**
 * Pure Honcho operations - no file system dependencies
 * Perfect for frontend/Lambda usage
 */

export interface HonchoClientOptions {
  apiKey?: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
}

export interface UploadMessagesOptions extends HonchoClientOptions {
  messages: Array<{ author: string; content: string }>
  sessionId?: string
}

export interface UploadMessagesResult {
  success: boolean
  message: string
  sessionId?: string
  messagesCount?: number
  uniqueAuthors?: string[]
}

/**
 * Uploads messages directly to Honcho (no file operations)
 * Pure function perfect for Lambda/frontend usage
 */
export async function uploadMessagesToHoncho(
  options: UploadMessagesOptions,
): Promise<UploadMessagesResult> {
  try {
    if (!options.messages || options.messages.length === 0) {
      return {
        success: false,
        message: "No messages provided",
      }
    }

    // Initialize Honcho client
    const honcho = new Honcho({
      apiKey: options.apiKey || process.env.HONCHO_API_KEY,
      workspaceId: options.workspaceId || "teach-honcho",
      environment: options.environment || "production",
    })

    // Generate session ID if not provided
    const sessionId =
      options.sessionId ||
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log("[HonchoClient] Session setup:", {
      providedSessionId: options.sessionId,
      finalSessionId: sessionId,
      isGenerated: !options.sessionId,
      workspaceId: options.workspaceId || "teach-honcho",
      environment: options.environment || "production",
    })

    // Create or retrieve the session - this is required before adding messages
    const session = await honcho.session(sessionId, {
      config: {
        observe_others: false,
        observe_me: true,
      },
    })

    // Ensure session exists by calling getMetadata (this will trigger getOrCreate)
    try {
      await session.getMetadata()
      console.log("[HonchoClient] Session created/retrieved successfully")
    } catch (error) {
      console.error("[HonchoClient] Failed to create/retrieve session:", error)
      throw error
    }

    // Create peers for unique authors
    const uniqueAuthors = [...new Set(options.messages.map((m) => m.author))]
    const peers: Record<string, Peer> = {}

    for (const author of uniqueAuthors) {
      peers[author] = await honcho.peer(author)
    }

    // Add peers to session
    await session.addPeers(Object.values(peers))

    // Create messages and add to session
    const honchoMessages = options.messages.map((msg) => {
      const peer = peers[msg.author]
      if (!peer) {
        throw new Error(`No peer found for author: ${msg.author}`)
      }
      return peer.message(msg.content)
    })

    // Add all messages to the session
    console.log("[HonchoClient] Adding messages to session:", {
      sessionId,
      messageCount: honchoMessages.length,
      uniqueAuthors,
      firstMessage: options.messages[0],
      lastMessage: options.messages[options.messages.length - 1],
    })

    await session.addMessages(honchoMessages)

    console.log("[HonchoClient] Upload successful:", {
      sessionId,
      messagesUploaded: options.messages.length,
      peers: uniqueAuthors,
    })

    return {
      success: true,
      message: `Successfully uploaded ${options.messages.length} messages to Honcho`,
      sessionId,
      messagesCount: options.messages.length,
      uniqueAuthors,
    }
  } catch (error) {
    return {
      success: false,
      message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export interface WorkingRepresentationOptions extends HonchoClientOptions {
  peerId: string
  targetPeerId?: string
}

export interface WorkingRepresentation {
  current_thoughts?: string
  emotional_state?: string
  goals?: string[]
  long_term_facts?: string[]
  [key: string]: unknown
}

export interface RepresentationResult {
  success: boolean
  message?: string
  representation?: WorkingRepresentation
}

export interface ConnectionTestResult {
  success: boolean
  message?: string
  connected: boolean
  apiKeyValid: boolean
}

export interface AskQuestionOptions extends HonchoClientOptions {
  peerId: string
  question: string
  targetPeerId?: string
  sessionId?: string
}

export interface QuestionResult {
  success: boolean
  message?: string
  answer?: string
}

/**
 * Ask Honcho a question about a peer's representation
 * Pure function perfect for Lambda/frontend usage
 */
export async function askHonchoQuestion(
  options: AskQuestionOptions,
): Promise<QuestionResult> {
  try {
    const honcho = new Honcho({
      apiKey: options.apiKey || process.env.HONCHO_API_KEY,
      workspaceId: options.workspaceId || "teach-honcho",
      environment: options.environment || "production",
    })

    // Get the peer
    const peer = await honcho.peer(options.peerId)

    // Ask the question using the chat method
    const response = await peer.chat(options.question, {
      target: options.targetPeerId,
      sessionId: options.sessionId,
    })

    return {
      success: true,
      answer: response || "No response received",
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
 * Retrieves working representation from Honcho (no file operations)
 * Pure function perfect for Lambda/frontend usage
 */
export async function getWorkingRepresentation(
  options: WorkingRepresentationOptions,
): Promise<RepresentationResult> {
  try {
    const honcho = new Honcho({
      apiKey: options.apiKey || process.env.HONCHO_API_KEY,
      workspaceId: options.workspaceId || "teach-honcho",
      environment: options.environment || "production",
    })

    // Get the peer
    const peer = await honcho.peer(options.peerId)

    // Use the chat method to query the representation
    const query = options.targetPeerId
      ? `What do I know about ${options.targetPeerId}?`
      : "What is my current state?"

    // The chat method with a target gives us the representation
    const response = await peer.chat(query, {
      target: options.targetPeerId,
      // Explicitly not providing sessionId to get global representation
    })

    // Parse the response if it's a string containing JSON
    let representation: WorkingRepresentation

    if (response && typeof response === "string") {
      try {
        representation = JSON.parse(response)
      } catch {
        // If it's not JSON, return it as a structured object
        representation = {
          representation: response,
        }
      }
    } else {
      representation =
        typeof response === "object" && response !== null
          ? (response as WorkingRepresentation)
          : {}
    }

    return {
      success: true,
      representation,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

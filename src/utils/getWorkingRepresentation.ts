import { Honcho } from "@honcho-ai/sdk"

interface WorkingRepresentationOptions {
  apiKey?: string
  workspaceId?: string
  environment?: 'local' | 'production' | 'demo'
  peerId: string
  targetPeerId?: string
}

interface WorkingRepresentation {
  current_thoughts?: string
  emotional_state?: string
  goals?: string[]
  long_term_facts?: string[]
  [key: string]: unknown
}

/**
 * Retrieves the working representation of a peer.
 * If targetPeerId is provided, returns the representation of the target from the perspective of the requesting peer.
 * Otherwise returns the peer's own working representation.
 * 
 * Note: This retrieves the global representation without specifying a session ID.
 * 
 * @param options - Configuration options
 * @returns Promise resolving to the working representation
 */
export async function getWorkingRepresentation(
  options: WorkingRepresentationOptions
): Promise<WorkingRepresentation> {
  const honcho = new Honcho({
    apiKey: options.apiKey || process.env.HONCHO_API_KEY,
    workspaceId: options.workspaceId || "teach-honcho",
    environment: options.environment || 'production',
  })

  // Get the peer
  const peer = honcho.peer(options.peerId)
  
  // Use the chat method to query the representation
  // According to the docs, when you don't specify a sessionId, you get the global representation
  const query = options.targetPeerId 
    ? `What do I know about ${options.targetPeerId}?`
    : "What is my current state?"
    
  try {
    // The chat method with a target gives us the representation
    const response = await peer.chat(query, {
      target: options.targetPeerId,
      // Explicitly not providing sessionId to get global representation
    })
    
    // Parse the response if it's a string containing JSON
    if (response && typeof response === 'string') {
      try {
        return JSON.parse(response)
      } catch {
        // If it's not JSON, return it as a structured object
        return {
          representation: response
        }
      }
    }
    
    return response || {}
  } catch (error) {
    console.error("Error retrieving working representation:", error)
    throw error
  }
}
export interface ChatJSON {
  mapping: Record<
    string,
    {
      message?: {
        author?: {
          role?: string
        }
        create_time?: number | null
        content?: {
          parts?: string[]
          text?: string
        } & Record<string, unknown>
        metadata?: Record<string, unknown>
        recipient?: string
      }
    }
  >
}

/**
 * Extracts the message content (text) from the provided ChatGPT-like JSON structure
 * for all `user` messages and `assistant` messages that are **not** visually hidden.
 *
 * The function is resilient to slight schema variations observed in different
 * export formats (e.g. camelCase vs snake_case metadata keys, `parts` array vs
 * single `text` field inside `content`).
 */
export function extractVisibleMessages(
  json: ChatJSON | undefined | null,
): Array<{ author: string; content: string }> {
  if (
    !json ||
    typeof json !== "object" ||
    !json.mapping ||
    typeof json.mapping !== "object"
  ) {
    return []
  }

  const messages: Array<{ time: number; author: string; content: string }> = []

  for (const node of Object.values(json.mapping)) {
    const msg = node.message
    if (!msg) continue

    const role = msg.author?.role
    if (role !== "user" && role !== "assistant") continue

    // Skip messages where recipient is "web" or "web.run"
    if (msg.recipient === "web" || msg.recipient === "web.run") continue

    // Skip assistant messages that are visually hidden
    if (
      role === "assistant" &&
      (msg.metadata?.is_visually_hidden_from_conversation === true ||
        msg.metadata?.isVisuallyHiddenFromConversation === true)
    ) {
      continue
    }

    // Extract the textual content
    let text = ""
    const content = msg.content as Record<string, unknown> | undefined
    if (content) {
      if (Array.isArray(content.parts)) {
        text = (content.parts as unknown[]).join("")
      } else if (typeof content.text === "string") {
        text = content.text
      }
    }

    if (text) {
      // Convert literal \n to actual newlines first
      text = text.replace(/\\\\n/g, "\n")

      // Remove content wrapped between E200/E202 pairs (like "tlwm", "cite", etc)
      text = text.replace(/[\uE200-\uE202][^\\n\\r]*?[\uE200-\uE202]/g, "")

      // Remove all remaining private use characters (E200-E206)
      text = text.replace(/[\uE200-\uE206]/g, "")

      // Remove citation markers like 'citeturn0search1' that might have escaped
      text = text.replace(/(?:cite)?turn\d+search\d+/gi, "")

      // Clean up any resulting multiple spaces or weird spacing
      text = text.replace(/ {2,}/g, " ").trim()

      messages.push({ time: msg.create_time ?? 0, author: role, content: text })
    }
  }

  // Sort chronologically to preserve conversation flow (best-effort)
  return messages
    .sort((a, b) => a.time - b.time)
    .map(({ author, content }) => ({ author, content }))
}

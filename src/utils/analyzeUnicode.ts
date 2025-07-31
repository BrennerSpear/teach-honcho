/**
 * Analyzes a string and outputs information about each character,
 * especially focusing on special/invisible Unicode characters
 */
export function analyzeUnicode(text: string): void {
  console.log("=== Unicode Character Analysis ===\n")

  const chars = Array.from(text)

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    if (!char) continue
    const codePoint = char.codePointAt(0)
    const hex = codePoint?.toString(16).toUpperCase().padStart(4, "0")

    // Determine if it's a special character
    const isSpecial =
      codePoint !== undefined &&
      // Control characters
      ((codePoint >= 0x0000 && codePoint <= 0x001f) ||
        (codePoint >= 0x007f && codePoint <= 0x009f) ||
        // Zero-width and formatting characters
        (codePoint >= 0x200b && codePoint <= 0x200f) ||
        (codePoint >= 0x2028 && codePoint <= 0x202f) ||
        (codePoint >= 0x205f && codePoint <= 0x206f) ||
        // Other special characters
        codePoint === 0xfeff ||
        (codePoint >= 0xfff9 && codePoint <= 0xfffb) ||
        // Private use area
        (codePoint >= 0xe000 && codePoint <= 0xf8ff))

    // Format the character for display
    let displayChar = char
    if (char === "\n") displayChar = "\\n"
    else if (char === "\r") displayChar = "\\r"
    else if (char === "\t") displayChar = "\\t"
    else if (isSpecial) displayChar = `[U+${hex}]`

    // Only show details for special characters or if verbose
    if (isSpecial || char === "\n" || char === "\r") {
      console.log(
        `Position ${i}: "${displayChar}" - U+${hex} ${getCharacterName(codePoint || 0)}`,
      )

      // Check if this might be a wrapper pair
      if (isSpecial && i < chars.length - 1) {
        // Look ahead for matching special character
        let j = i + 1
        let content = ""
        while (j < chars.length && j < i + 30) {
          // Look up to 30 chars ahead
          const nextChar = chars[j]
          if (!nextChar) {
            j++
            continue
          }
          const nextCodePoint = nextChar.codePointAt(0)
          if (nextCodePoint !== undefined && isSpecialChar(nextCodePoint)) {
            // Found potential closing character
            if (content.length > 0) {
              console.log(`  → Wraps content: "${content}"`)
            }
            break
          }
          content += nextChar
          j++
        }
      }
    }
  }

  // Summary of special characters found
  console.log("\n=== Summary of Special Characters ===")
  const specialChars = new Map<number, number>()

  for (const char of chars) {
    const codePoint = char.codePointAt(0)
    if (codePoint !== undefined && isSpecialChar(codePoint)) {
      specialChars.set(codePoint, (specialChars.get(codePoint) || 0) + 1)
    }
  }

  for (const [codePoint, count] of specialChars.entries()) {
    const hex = codePoint.toString(16).toUpperCase().padStart(4, "0")
    console.log(
      `U+${hex} (${getCharacterName(codePoint)}): ${count} occurrences`,
    )
  }
}

function isSpecialChar(codePoint: number): boolean {
  return (
    (codePoint >= 0x0000 && codePoint <= 0x001f) ||
    (codePoint >= 0x007f && codePoint <= 0x009f) ||
    (codePoint >= 0x200b && codePoint <= 0x200f) ||
    (codePoint >= 0x2028 && codePoint <= 0x202f) ||
    (codePoint >= 0x205f && codePoint <= 0x206f) ||
    codePoint === 0xfeff ||
    (codePoint >= 0xfff9 && codePoint <= 0xfffb) ||
    (codePoint >= 0xe000 && codePoint <= 0xf8ff)
  )
}

function getCharacterName(codePoint: number): string {
  // Common special characters
  const names: Record<number, string> = {
    0: "NULL",
    9: "TAB",
    10: "LINE FEED",
    13: "CARRIAGE RETURN",
    8203: "ZERO WIDTH SPACE",
    8204: "ZERO WIDTH NON-JOINER",
    8205: "ZERO WIDTH JOINER",
    8206: "LEFT-TO-RIGHT MARK",
    8207: "RIGHT-TO-LEFT MARK",
    8234: "LEFT-TO-RIGHT EMBEDDING",
    8235: "RIGHT-TO-LEFT EMBEDDING",
    8236: "POP DIRECTIONAL FORMATTING",
    8237: "LEFT-TO-RIGHT OVERRIDE",
    8238: "RIGHT-TO-LEFT OVERRIDE",
    65279: "BYTE ORDER MARK",
    65529: "INTERLINEAR ANNOTATION ANCHOR",
    65530: "INTERLINEAR ANNOTATION SEPARATOR",
    65531: "INTERLINEAR ANNOTATION TERMINATOR",
  }

  if (names[codePoint]) return names[codePoint]

  if (codePoint >= 0xe000 && codePoint <= 0xf8ff) {
    return "PRIVATE USE CHARACTER"
  }

  return "SPECIAL CHARACTER"
}

// Example usage function
export function analyzeMessageContent(content: string): void {
  console.log("Original text preview (first 200 chars):")
  console.log(`${content.substring(0, 200)}...\n`)

  analyzeUnicode(content)
}

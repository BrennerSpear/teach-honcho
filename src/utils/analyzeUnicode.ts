/**
 * Analyzes a string and outputs information about each character,
 * especially focusing on special/invisible Unicode characters
 */
export function analyzeUnicode(text: string): void {
  console.log("=== Unicode Character Analysis ===\n");
  
  const chars = Array.from(text);
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const codePoint = char.codePointAt(0);
    const hex = codePoint?.toString(16).toUpperCase().padStart(4, '0');
    
    // Determine if it's a special character
    const isSpecial = codePoint !== undefined && (
      // Control characters
      (codePoint >= 0x0000 && codePoint <= 0x001F) ||
      (codePoint >= 0x007F && codePoint <= 0x009F) ||
      // Zero-width and formatting characters
      (codePoint >= 0x200B && codePoint <= 0x200F) ||
      (codePoint >= 0x2028 && codePoint <= 0x202F) ||
      (codePoint >= 0x205F && codePoint <= 0x206F) ||
      // Other special characters
      codePoint === 0xFEFF ||
      (codePoint >= 0xFFF9 && codePoint <= 0xFFFB) ||
      // Private use area
      (codePoint >= 0xE000 && codePoint <= 0xF8FF)
    );
    
    // Format the character for display
    let displayChar = char;
    if (char === '\n') displayChar = '\\n';
    else if (char === '\r') displayChar = '\\r';
    else if (char === '\t') displayChar = '\\t';
    else if (isSpecial) displayChar = `[U+${hex}]`;
    
    // Only show details for special characters or if verbose
    if (isSpecial || char === '\n' || char === '\r') {
      console.log(`Position ${i}: "${displayChar}" - U+${hex} ${getCharacterName(codePoint || 0)}`);
      
      // Check if this might be a wrapper pair
      if (isSpecial && i < chars.length - 1) {
        // Look ahead for matching special character
        let j = i + 1;
        let content = '';
        while (j < chars.length && j < i + 30) { // Look up to 30 chars ahead
          const nextChar = chars[j];
          const nextCodePoint = nextChar.codePointAt(0);
          if (nextCodePoint !== undefined && isSpecialChar(nextCodePoint)) {
            // Found potential closing character
            if (content.length > 0) {
              console.log(`  → Wraps content: "${content}"`);
            }
            break;
          }
          content += nextChar;
          j++;
        }
      }
    }
  }
  
  // Summary of special characters found
  console.log("\n=== Summary of Special Characters ===");
  const specialChars = new Map<number, number>();
  
  for (const char of chars) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && isSpecialChar(codePoint)) {
      specialChars.set(codePoint, (specialChars.get(codePoint) || 0) + 1);
    }
  }
  
  for (const [codePoint, count] of specialChars.entries()) {
    const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
    console.log(`U+${hex} (${getCharacterName(codePoint)}): ${count} occurrences`);
  }
}

function isSpecialChar(codePoint: number): boolean {
  return (
    (codePoint >= 0x0000 && codePoint <= 0x001F) ||
    (codePoint >= 0x007F && codePoint <= 0x009F) ||
    (codePoint >= 0x200B && codePoint <= 0x200F) ||
    (codePoint >= 0x2028 && codePoint <= 0x202F) ||
    (codePoint >= 0x205F && codePoint <= 0x206F) ||
    codePoint === 0xFEFF ||
    (codePoint >= 0xFFF9 && codePoint <= 0xFFFB) ||
    (codePoint >= 0xE000 && codePoint <= 0xF8FF)
  );
}

function getCharacterName(codePoint: number): string {
  // Common special characters
  const names: Record<number, string> = {
    0x0000: 'NULL',
    0x0009: 'TAB',
    0x000A: 'LINE FEED',
    0x000D: 'CARRIAGE RETURN',
    0x200B: 'ZERO WIDTH SPACE',
    0x200C: 'ZERO WIDTH NON-JOINER',
    0x200D: 'ZERO WIDTH JOINER',
    0x200E: 'LEFT-TO-RIGHT MARK',
    0x200F: 'RIGHT-TO-LEFT MARK',
    0x202A: 'LEFT-TO-RIGHT EMBEDDING',
    0x202B: 'RIGHT-TO-LEFT EMBEDDING',
    0x202C: 'POP DIRECTIONAL FORMATTING',
    0x202D: 'LEFT-TO-RIGHT OVERRIDE',
    0x202E: 'RIGHT-TO-LEFT OVERRIDE',
    0xFEFF: 'BYTE ORDER MARK',
    0xFFF9: 'INTERLINEAR ANNOTATION ANCHOR',
    0xFFFA: 'INTERLINEAR ANNOTATION SEPARATOR',
    0xFFFB: 'INTERLINEAR ANNOTATION TERMINATOR'
  };
  
  if (names[codePoint]) return names[codePoint];
  
  if (codePoint >= 0xE000 && codePoint <= 0xF8FF) {
    return 'PRIVATE USE CHARACTER';
  }
  
  return 'SPECIAL CHARACTER';
}

// Example usage function
export function analyzeMessageContent(content: string): void {
  console.log("Original text preview (first 200 chars):");
  console.log(content.substring(0, 200) + "...\n");
  
  analyzeUnicode(content);
}
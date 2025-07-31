import { getWorkingRepresentation } from "../src/utils/getWorkingRepresentation"

async function main() {
  const peerId = process.argv[2]
  const targetPeerId = process.argv[3]
  
  if (!peerId) {
    console.error("Usage: pnpm get:representation <peerId> [targetPeerId]")
    console.error("\nExamples:")
    console.error("  pnpm get:representation user                # Get user's own representation")
    console.error("  pnpm get:representation user assistant      # Get user's view of assistant")
    process.exit(1)
  }
  
  try {
    console.log(`\nRetrieving working representation for peer: ${peerId}`)
    if (targetPeerId) {
      console.log(`Target peer: ${targetPeerId} (from ${peerId}'s perspective)`)
    }
    console.log("=" + "=".repeat(60))
    
    const representation = await getWorkingRepresentation({
      peerId,
      targetPeerId,
    })
    
    // Pretty print the representation
    console.log("\nWorking Representation:")
    console.log(JSON.stringify(representation, null, 2))
    
    // If it has structured fields, display them nicely
    if (typeof representation === 'object' && representation !== null) {
      console.log("\n" + "-".repeat(60))
      
      if (representation.current_thoughts) {
        console.log("\n📭 Current Thoughts:")
        console.log(representation.current_thoughts)
      }
      
      if (representation.emotional_state) {
        console.log("\n💭 Emotional State:")
        console.log(representation.emotional_state)
      }
      
      if (representation.goals && Array.isArray(representation.goals)) {
        console.log("\n🎯 Goals:")
        representation.goals.forEach((goal, i) => {
          console.log(`  ${i + 1}. ${goal}`)
        })
      }
      
      if (representation.long_term_facts && Array.isArray(representation.long_term_facts)) {
        console.log("\n📚 Long-term Facts:")
        representation.long_term_facts.forEach((fact, i) => {
          console.log(`  ${i + 1}. ${fact}`)
        })
      }
    }
    
  } catch (error) {
    console.error("\nError:", error)
    process.exit(1)
  }
}

main()
#!/usr/bin/env tsx
import { getWorkingRepresentation } from "../src/core/honchoClient"

async function main() {
  const peerId = process.argv[2]
  const targetPeerId = process.argv[3]

  if (!peerId || peerId === "--help" || peerId === "-h") {
    console.log(`
📊 Get Working Representation

Usage: pnpm get:representation <peerId> [targetPeerId]

Description:
  Retrieves the working representation of a peer from Honcho AI.
  If targetPeerId is provided, gets the representation of the target
  from the perspective of the requesting peer.

Arguments:
  peerId        The peer ID to query from
  targetPeerId  Optional: The target peer to get representation of

Examples:
  pnpm get:representation user                # Get user's own representation
  pnpm get:representation user assistant      # Get user's view of assistant

Notes:
  - Requires HONCHO_API_KEY environment variable
  - Retrieves global representation (not session-specific)
  - Output includes structured fields like thoughts, goals, facts
`)
    process.exit(peerId ? 0 : 1)
  }

  try {
    console.log(`\nRetrieving working representation for peer: ${peerId}`)
    if (targetPeerId) {
      console.log(`Target peer: ${targetPeerId} (from ${peerId}'s perspective)`)
    }
    console.log(`=${"=".repeat(60)}`)

    const result = await getWorkingRepresentation({
      peerId,
      targetPeerId,
    })

    if (!result.success) {
      console.error(`\n❌ Error: ${result.message}`)
      process.exit(1)
    }

    if (!result.representation) {
      console.error("\n❌ Error: No representation data returned")
      process.exit(1)
    }

    const representation = result.representation

    // Pretty print the representation
    console.log("\nWorking Representation:")
    console.log(JSON.stringify(representation, null, 2))

    // If it has structured fields, display them nicely
    if (typeof representation === "object" && representation !== null) {
      console.log(`\n${"-".repeat(60)}`)

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

      if (
        representation.long_term_facts &&
        Array.isArray(representation.long_term_facts)
      ) {
        console.log("\n📚 Long-term Facts:")
        representation.long_term_facts.forEach((fact, i) => {
          console.log(`  ${i + 1}. ${fact}`)
        })
      }
    }
  } catch (error) {
    console.error("\n❌ Unexpected error:", error)
    process.exit(1)
  }
}

main()

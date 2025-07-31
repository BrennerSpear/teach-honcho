#!/usr/bin/env tsx
import { join } from "node:path"
import {
  type BatchOptions,
  getBatchFiles,
  processBatch,
} from "../src/file-ops/batchProcessor"
import { cleanChatFromRaw } from "../src/file-ops/chatCleaner"

async function batchCleanChats() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const options: BatchOptions = {}

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--start":
      case "-s":
        options.startIndex = parseInt(args[++i] || "0")
        break
      case "--end":
      case "-e":
        options.endIndex = parseInt(args[++i] || "0")
        break
      case "--dry-run":
      case "-d":
        options.dryRun = true
        break
      case "--help":
      case "-h":
        showHelp()
        process.exit(0)
    }
  }

  try {
    // Get all JSON files from raw directory
    const rawDir = join(process.cwd(), "chats", "raw")
    const files = getBatchFiles(rawDir, options)

    if (files.length === 0) {
      console.log("No JSON files found in chats/raw directory")
      return
    }

    // Show available files info
    console.log(`\n📁 Found ${files.length} JSON file(s) in range:`)
    if (files.length <= 10) {
      // Show all files if there are 10 or fewer
      files.forEach((file) => {
        console.log(`   [${file.index}] ${file.filename}`)
      })
    } else {
      // Show first 5 and last 5 if more than 10
      files.slice(0, 5).forEach((file) => {
        console.log(`   [${file.index}] ${file.filename}`)
      })
      console.log(`   ... ${files.length - 10} more files ...`)
      files.slice(-5).forEach((file) => {
        console.log(`   [${file.index}] ${file.filename}`)
      })
    }

    // Display batch info
    const startIdx = files[0]?.index ?? 0
    const endIdx = files[files.length - 1]?.index ?? 0
    console.log(
      `\n🔄 Processing batch: files ${startIdx} to ${endIdx} (${files.length} file${files.length !== 1 ? "s" : ""})`,
    )
    if (options.dryRun) {
      console.log("🔍 DRY RUN MODE - No files will be processed\n")
    } else {
      console.log("")
    }

    // Process files
    const result = await processBatch(
      files,
      async (file) => {
        console.log(`[${file.index}/${endIdx}] 🧹 Cleaning ${file.filename}...`)

        const cleanResult = await cleanChatFromRaw(file.filename)

        if (cleanResult.success) {
          console.log(
            `[${file.index}/${endIdx}] ✅ Successfully cleaned ${file.filename}`,
          )
        } else {
          console.error(
            `[${file.index}/${endIdx}] ❌ Error cleaning ${file.filename}: ${cleanResult.message}`,
          )
        }

        return cleanResult
      },
      { dryRun: options.dryRun },
    )

    // Summary
    console.log("\n📊 Batch Processing Summary:")
    console.log(`   Total files in range: ${result.summary.total}`)
    if (!options.dryRun) {
      console.log(`   ✅ Successfully cleaned: ${result.summary.success}`)
      console.log(`   ⏭️  Skipped (already clean): ${result.summary.skipped}`)
      console.log(`   ❌ Errors: ${result.summary.error}`)
    } else {
      console.log(
        `   🔍 Files to be cleaned: ${result.summary.total - result.summary.skipped}`,
      )
      console.log(`   ⏭️  Would skip (already clean): ${result.summary.skipped}`)
    }

    // Show next batch suggestion
    // Files remain in raw directory, so use traditional next batch logic
    const totalRawFiles = getBatchFiles(rawDir, {}).length
    if (endIdx < totalRawFiles - 1) {
      const nextStart = endIdx + 1
      const nextEnd = Math.min(nextStart + 9, totalRawFiles - 1)
      console.log(`\n💡 To process the next batch, run:`)
      console.log(`   pnpm batch:clean --start ${nextStart} --end ${nextEnd}`)
    } else if (result.summary.total > 0) {
      console.log(`\n✅ All files have been processed!`)
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
📚 Batch Clean Chat Files

Usage: pnpm batch:clean [options]

Options:
  -s, --start <index>   Starting index (default: 0)
  -e, --end <index>     Ending index (default: last file)
  -d, --dry-run         Show what would be done without executing
  -h, --help           Show this help message

Examples:
  pnpm batch:clean                    # Process all files
  pnpm batch:clean --start 0 --end 9  # Process first 10 files
  pnpm batch:clean -s 10 -e 19        # Process files 10-19
  pnpm batch:clean --dry-run          # See what would be processed

Notes:
  - Files are processed in alphabetical order
  - Already cleaned files are automatically skipped
  - Index is 0-based (first file is index 0)
`)
}

// Run the batch processor
batchCleanChats().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

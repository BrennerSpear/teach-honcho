#!/usr/bin/env tsx
import { join } from "node:path"
import {
  type BatchOptions,
  getBatchFiles,
  processBatch,
} from "../src/file-ops/batchProcessor"
import { uploadChatToHoncho } from "../src/file-ops/honchoUploader"

async function batchUploadChats() {
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

  // Check if Honcho API key is set
  if (!process.env.HONCHO_API_KEY && !options.dryRun) {
    console.error("\n❌ Error: HONCHO_API_KEY environment variable is not set")
    console.error("Please add it to your .env file")
    process.exit(1)
  }

  try {
    // Get all JSON files from clean directory
    const cleanDir = join(process.cwd(), "chats", "clean")
    const files = getBatchFiles(cleanDir, options)

    if (files.length === 0) {
      console.log("No JSON files found in chats/clean directory")
      return
    }

    // Show available files info
    console.log(`\n📁 Found ${files.length} JSON file(s) in range:`)
    if (files.length <= 10) {
      // Show all files if there are 10 or fewer
      for (const file of files) {
        console.log(`   [${file.index}] ${file.filename}`)
      }
    } else {
      // Show first 5 and last 5 if more than 10
      for (const file of files.slice(0, 5)) {
        console.log(`   [${file.index}] ${file.filename}`)
      }
      console.log(`   ... ${files.length - 10} more files ...`)
      for (const file of files.slice(-5)) {
        console.log(`   [${file.index}] ${file.filename}`)
      }
    }

    // Display batch info
    const startIdx = files[0]?.index ?? 0
    const endIdx = files[files.length - 1]?.index ?? 0
    console.log(
      `\n🔄 Processing batch: files ${startIdx} to ${endIdx} (${files.length} file${files.length !== 1 ? "s" : ""})`,
    )
    if (options.dryRun) {
      console.log("🔍 DRY RUN MODE - No files will be uploaded\n")
    } else {
      console.log("")
    }

    // Process files
    const result = await processBatch(
      files,
      async (file) => {
        if (options.dryRun) {
          console.log(
            `[${file.index}/${endIdx}] 🔍 Would upload ${file.filename}`,
          )
          return { success: true, message: "Dry run", skipped: false }
        }

        console.log(
          `[${file.index}/${endIdx}] 📤 Uploading ${file.filename}...`,
        )

        const uploadResult = await uploadChatToHoncho({
          filePath: file.filename,
          moveToProcessed: true,
          skipIfProcessed: true,
        })

        if (uploadResult.success) {
          if (uploadResult.skipped) {
            console.log(
              `[${file.index}/${endIdx}] ⏭️  Skipping ${file.filename} (already processed)`,
            )
          } else {
            console.log(
              `[${file.index}/${endIdx}] ✅ Successfully uploaded ${file.filename}`,
            )
          }
        } else {
          console.error(
            `[${file.index}/${endIdx}] ❌ Error uploading ${file.filename}: ${uploadResult.message}`,
          )
        }

        return uploadResult
      },
      { dryRun: options.dryRun },
    )

    // Summary
    console.log("\n📊 Batch Upload Summary:")
    console.log(`   Total files in range: ${result.summary.total}`)
    if (!options.dryRun) {
      console.log(`   ✅ Successfully uploaded: ${result.summary.success}`)
      console.log(
        `   ⏭️  Skipped (already processed): ${result.summary.skipped}`,
      )
      console.log(`   ❌ Errors: ${result.summary.error}`)
    } else {
      console.log(
        `   🔍 Files to be uploaded: ${result.summary.total - result.summary.skipped}`,
      )
      console.log(
        `   ⏭️  Would skip (already processed): ${result.summary.skipped}`,
      )
    }

    // Show next batch suggestion
    // Since successfully uploaded files are moved out, remaining files shift down
    const remainingAfterSuccess = files.length - result.summary.success
    if (remainingAfterSuccess > 0) {
      const nextBatchSize = Math.min(10, remainingAfterSuccess)
      console.log(
        `\n💡 To process remaining ${remainingAfterSuccess} files, run:`,
      )
      console.log(`   pnpm batch:upload --start 0 --end ${nextBatchSize - 1}`)
      console.log(`   (Successfully uploaded files were moved to processed/)`)
    } else if (result.summary.total > 0) {
      console.log(`\n✅ All files in this batch have been processed!`)
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
📚 Batch Upload Chat Files to Honcho

Usage: pnpm batch:upload [options]

Options:
  -s, --start <index>   Starting index (default: 0)
  -e, --end <index>     Ending index (default: last file)
  -d, --dry-run         Show what would be done without executing
  -h, --help           Show this help message

Examples:
  pnpm batch:upload                    # Process all files
  pnpm batch:upload --start 0 --end 9  # Process first 10 files
  pnpm batch:upload -s 10 -e 19        # Process files 10-19
  pnpm batch:upload --dry-run          # See what would be uploaded

Notes:
  - Files are processed in alphabetical order
  - Successfully uploaded files are moved to chats/processed
  - Already processed files are automatically skipped
  - Index is 0-based (first file is index 0)
  - Requires HONCHO_API_KEY in .env file
`)
}

// Run the batch processor
batchUploadChats().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

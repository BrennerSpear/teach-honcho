import { readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"

interface BatchOptions {
  startIndex?: number
  endIndex?: number
  dryRun?: boolean
}

/**
 * Batch processes cleaned chat files and uploads them to Honcho
 */
async function batchUploadChats() {
  // Parse command line arguments
  const args = process.argv.slice(2)
  const options: BatchOptions = {}
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--start":
      case "-s":
        options.startIndex = parseInt(args[++i])
        break
      case "--end":
      case "-e":
        options.endIndex = parseInt(args[++i])
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
  
  // Get all JSON files from clean directory
  const cleanDir = join(process.cwd(), "chats", "clean")
  const processedDir = join(process.cwd(), "chats", "processed")
  
  if (!existsSync(cleanDir)) {
    console.error("Error: chats/clean directory not found")
    process.exit(1)
  }
  
  // Get all JSON files and sort them
  const files = readdirSync(cleanDir)
    .filter(file => file.endsWith(".json"))
    .sort()
  
  if (files.length === 0) {
    console.log("No JSON files found in chats/clean directory")
    return
  }
  
  // Show available files info
  console.log(`\n📁 Found ${files.length} JSON file(s) in chats/clean:`)
  if (files.length <= 10) {
    // Show all files if there are 10 or fewer
    files.forEach((file, i) => {
      console.log(`   [${i}] ${file}`)
    })
  } else {
    // Show first 5 and last 5 if more than 10
    files.slice(0, 5).forEach((file, i) => {
      console.log(`   [${i}] ${file}`)
    })
    console.log(`   ... ${files.length - 10} more files ...`)
    files.slice(-5).forEach((file, i) => {
      console.log(`   [${files.length - 5 + i}] ${file}`)
    })
  }
  
  // Apply index bounds
  const startIdx = options.startIndex ?? 0
  const endIdx = options.endIndex ?? files.length - 1
  
  // Validate indices
  if (startIdx < 0 || startIdx >= files.length) {
    console.error(`Invalid start index: ${startIdx}. Must be between 0 and ${files.length - 1}`)
    process.exit(1)
  }
  
  if (endIdx < startIdx || endIdx >= files.length) {
    console.error(`Invalid end index: ${endIdx}. Must be between ${startIdx} and ${files.length - 1}`)
    process.exit(1)
  }
  
  // Check if Honcho API key is set
  if (!process.env.HONCHO_API_KEY && !options.dryRun) {
    console.error("\n❌ Error: HONCHO_API_KEY environment variable is not set")
    console.error("Please add it to your .env file")
    process.exit(1)
  }
  
  // Display batch info
  console.log(`\n🔄 Processing batch: files ${startIdx} to ${endIdx} (${endIdx - startIdx + 1} file${endIdx - startIdx + 1 !== 1 ? 's' : ''})`)
  if (options.dryRun) {
    console.log("🔍 DRY RUN MODE - No files will be uploaded\n")
  } else {
    console.log("")
  }
  
  // Process files in the specified range
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (let i = startIdx; i <= endIdx; i++) {
    const filename = files[i]
    const processedPath = join(processedDir, filename)
    
    // Check if already processed
    if (existsSync(processedPath)) {
      console.log(`[${i}/${files.length - 1}] ⏭️  Skipping ${filename} (already processed)`)
      skipCount++
      continue
    }
    
    console.log(`[${i}/${files.length - 1}] 📤 Uploading ${filename}...`)
    
    if (!options.dryRun) {
      try {
        // Run the upload:chat script for this file
        execSync(`pnpm upload:chat "${filename}"`, {
          stdio: 'inherit',  // Show upload progress
          encoding: 'utf-8'
        })
        console.log(`[${i}/${files.length - 1}] ✅ Successfully uploaded ${filename}`)
        successCount++
      } catch (error) {
        console.error(`[${i}/${files.length - 1}] ❌ Error uploading ${filename}:`, error.message)
        errorCount++
      }
    } else {
      // In dry run mode, just show what would be done
      console.log(`[${i}/${files.length - 1}] 🔍 Would upload ${filename}`)
    }
  }
  
  // Summary
  console.log("\n📊 Batch Upload Summary:")
  console.log(`   Total files in range: ${endIdx - startIdx + 1}`)
  if (!options.dryRun) {
    console.log(`   ✅ Successfully uploaded: ${successCount}`)
    console.log(`   ⏭️  Skipped (already processed): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
  } else {
    console.log(`   🔍 Files to be uploaded: ${endIdx - startIdx + 1 - skipCount}`)
    console.log(`   ⏭️  Would skip (already processed): ${skipCount}`)
  }
  
  // Show next batch suggestion if not at end
  if (endIdx < files.length - 1) {
    console.log(`\n💡 To process the next batch, run:`)
    console.log(`   pnpm batch:upload --start ${endIdx + 1} --end ${Math.min(endIdx + 10, files.length - 1)}`)
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
batchUploadChats().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
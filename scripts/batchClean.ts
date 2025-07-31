import { readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"

interface BatchOptions {
  startIndex?: number
  endIndex?: number
  dryRun?: boolean
}

/**
 * Batch processes raw chat files through the cleaning script
 */
async function batchCleanChats() {
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
  
  // Get all JSON files from raw directory
  const rawDir = join(process.cwd(), "chats", "raw")
  const cleanDir = join(process.cwd(), "chats", "clean")
  
  if (!existsSync(rawDir)) {
    console.error("Error: chats/raw directory not found")
    process.exit(1)
  }
  
  // Get all JSON files and sort them
  const files = readdirSync(rawDir)
    .filter(file => file.endsWith(".json"))
    .sort()
  
  if (files.length === 0) {
    console.log("No JSON files found in chats/raw directory")
    return
  }
  
  // Show available files info
  console.log(`\n📁 Found ${files.length} JSON file(s) in chats/raw:`)
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
  
  // Display batch info
  console.log(`\n🔄 Processing batch: files ${startIdx} to ${endIdx} (${endIdx - startIdx + 1} file${endIdx - startIdx + 1 !== 1 ? 's' : ''})`)
  if (options.dryRun) {
    console.log("🔍 DRY RUN MODE - No files will be processed\n")
  } else {
    console.log("")
  }
  
  // Process files in the specified range
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (let i = startIdx; i <= endIdx; i++) {
    const filename = files[i]
    const cleanPath = join(cleanDir, filename)
    
    // Check if already cleaned
    if (existsSync(cleanPath)) {
      console.log(`[${i}/${files.length - 1}] ⏭️  Skipping ${filename} (already cleaned)`)
      skipCount++
      continue
    }
    
    console.log(`[${i}/${files.length - 1}] 🧹 Cleaning ${filename}...`)
    
    if (!options.dryRun) {
      try {
        // Run the clean:chat script for this file
        execSync(`pnpm clean:chat "${filename}"`, {
          stdio: 'pipe',
          encoding: 'utf-8'
        })
        console.log(`[${i}/${files.length - 1}] ✅ Successfully cleaned ${filename}`)
        successCount++
      } catch (error) {
        console.error(`[${i}/${files.length - 1}] ❌ Error cleaning ${filename}:`, error.message)
        errorCount++
      }
    } else {
      // In dry run mode, just show what would be done
      console.log(`[${i}/${files.length - 1}] 🔍 Would clean ${filename}`)
    }
  }
  
  // Summary
  console.log("\n📊 Batch Processing Summary:")
  console.log(`   Total files in range: ${endIdx - startIdx + 1}`)
  if (!options.dryRun) {
    console.log(`   ✅ Successfully cleaned: ${successCount}`)
    console.log(`   ⏭️  Skipped (already clean): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
  } else {
    console.log(`   🔍 Files to be cleaned: ${endIdx - startIdx + 1 - skipCount}`)
    console.log(`   ⏭️  Would skip (already clean): ${skipCount}`)
  }
  
  // Show next batch suggestion if not at end
  if (endIdx < files.length - 1) {
    console.log(`\n💡 To process the next batch, run:`)
    console.log(`   pnpm batch:clean --start ${endIdx + 1} --end ${Math.min(endIdx + 10, files.length - 1)}`)
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
batchCleanChats().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
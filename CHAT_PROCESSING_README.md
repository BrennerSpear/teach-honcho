# Chat Processing System

This repository contains a complete system for processing ChatGPT export files and uploading them to Honcho AI. The code is organized to support both CLI usage and frontend/API integration.

## Architecture

### 📁 Directory Structure

```
src/core/              # Pure JSON processing (zero file dependencies)
├── chatProcessor.ts   # Process ChatGPT exports in memory
├── honchoClient.ts    # Upload to Honcho, get representations
└── index.ts           # Exports all core functions

src/file-ops/          # File system operations  
├── chatCleaner.ts     # File wrapper around core functions
├── honchoUploader.ts  # File operations + core upload
├── batchProcessor.ts  # Batch file processing utilities
└── index.ts           # Exports all file-ops functions


cli/                   # CLI wrapper scripts
├── cleanChat.ts       # Single file cleaning
├── batchClean.ts      # Batch cleaning
├── uploadChat.ts      # Single file upload
├── batchUpload.ts     # Batch upload
└── getRepresentation.ts # Get peer representations

src/examples/          # Usage examples
└── frontendUsage.ts   # Lambda/frontend examples
```

### 🔧 Core Services

#### **Pure Functions (Perfect for Lambda/Frontend)**

**Chat Processor (`chatProcessor.ts`)**
- ✅ **Zero file system dependencies**
- Processes ChatGPT export JSON directly in memory
- Validates and extracts messages from any format
- Returns structured `{ messages, messageCount, originalFormat }`

**Honcho Client (`honchoClient.ts`)**
- ✅ **Zero file system dependencies** 
- Uploads messages directly to Honcho AI platform
- Gets working representations from Honcho
- Pure functions perfect for serverless environments

#### **File-based Services (For CLI Usage)**

**Chat Cleaner (`chatCleaner.ts`)**
- File wrapper around pure `processChatData` function
- Handles file I/O operations for CLI usage
- Saves cleaned data to filesystem

**Honcho Uploader (`honchoUploader.ts`)**
- File wrapper around pure `uploadMessagesToHoncho` function
- Handles file movement (processed/error folders)
- Manages file system operations for CLI usage

**Batch Processor (`batchProcessor.ts`)**
- Processes multiple files with index ranges
- Provides progress tracking and error handling
- Supports dry-run mode for testing

**Representation Service (`honchoRepresentation.ts`)**
- Wrapper around pure `getWorkingRepresentation` function
- Maintains backward compatibility for existing code

## 🖥️ CLI Usage

### Individual Commands

```bash
# Clean a single file
pnpm clean:chat filename.json

# Upload a single file
pnpm upload:chat filename.json

# Get peer representation
pnpm get:representation peerId [targetPeerId]
```

### Batch Commands

```bash
# Clean all files
pnpm batch:clean

# Clean files 0-9
pnpm batch:clean --start 0 --end 9

# Upload files 10-19
pnpm batch:upload -s 10 -e 19

# Dry run to see what would be processed
pnpm batch:clean --dry-run

# Get help for any command
pnpm clean:chat --help
pnpm batch:upload --help
```

## 🌐 Frontend/Lambda Integration

### Import Pure Functions (Recommended)

```typescript
import { 
  processChatData,
  validateChatGPTExport,
  uploadMessagesToHoncho,
  getWorkingRepresentation
} from '../core'
```

### Example Usage (Zero File Dependencies)

```typescript
// Process ChatGPT export JSON directly
const processResult = processChatData(jsonData)
if (processResult.success) {
  const messages = processResult.data.messages
  const messageCount = processResult.data.messageCount
}

// Upload messages directly to Honcho
const uploadResult = await uploadMessagesToHoncho({
  messages: [
    { author: 'user', content: 'Hello' },
    { author: 'assistant', content: 'Hi there!' }
  ],
  sessionId: 'my-session',
  apiKey: process.env.HONCHO_API_KEY
})

// Complete pipeline: JSON → Process → Upload
async function processAndUpload(jsonData: any) {
  const processResult = processChatData(jsonData)
  if (!processResult.success) throw new Error(processResult.message)
  
  const uploadResult = await uploadMessagesToHoncho({
    messages: processResult.data.messages,
    apiKey: process.env.HONCHO_API_KEY
  })
  
  return uploadResult
}

// Get representation
const reprResult = await getWorkingRepresentation({
  peerId: 'user',
  targetPeerId: 'assistant'
})
```

### Next.js API Route Example

```typescript
// pages/api/upload-chat.ts
import { processChatData, uploadMessagesToHoncho } from '../../src/core'

export default async function handler(req, res) {
  try {
    const { chatData, sessionId } = req.body
    
    // Process JSON directly (no file system)
    const processResult = processChatData(chatData)
    if (!processResult.success) {
      return res.status(400).json({ error: processResult.message })
    }
    
    // Upload directly to Honcho (no file system)
    const uploadResult = await uploadMessagesToHoncho({
      messages: processResult.data.messages,
      sessionId,
      apiKey: process.env.HONCHO_API_KEY
    })
    
    if (!uploadResult.success) {
      return res.status(500).json({ error: uploadResult.message })
    }
    
    res.json({
      success: true,
      messagesProcessed: processResult.data.messageCount,
      sessionId: uploadResult.sessionId,
      uniqueAuthors: uploadResult.uniqueAuthors
    })
    
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

## 📦 Data Flow

```
Raw ChatGPT Export → Clean JSON → Honcho Upload → Processed
      ↓                ↓             ↓            ↓
   chats/raw      chats/clean   Honcho AI   chats/processed
                                    ↓
                              chats/error (if failed)
```

## 🔑 Environment Variables

```bash
HONCHO_API_KEY=your_api_key_here
```

## 🚨 Error Handling

- All services return result objects with `success` boolean
- CLI scripts show user-friendly error messages
- Files are safely moved to error folders on upload failure
- Type-safe error handling throughout

## 🧩 Key Features

- **Separation of Concerns**: Business logic separated from CLI/UI
- **Reusable**: Services can be used in both CLI and frontend
- **Type Safe**: Full TypeScript support with proper types
- **Error Resilient**: Comprehensive error handling and recovery
- **Progress Tracking**: Batch operations show progress and summaries
- **Flexible**: Supports both file-based and in-memory processing
- **Help System**: All CLI commands have built-in help

## 🔄 Migration from Old Structure

The old `scripts/` directory has been replaced with:
- Core logic moved to `src/services/`
- CLI wrappers in `cli/` directory
- `package.json` scripts updated to use new structure
- Backward compatibility maintained through re-exports
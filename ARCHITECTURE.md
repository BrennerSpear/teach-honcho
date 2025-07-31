# Architecture Overview

This project has a clear separation between pure JSON processing functions and file system operations, making it easy to use in both CLI and serverless environments.

## 📁 Directory Structure

```
src/
├── core/                    # Pure JSON processing (zero file dependencies)
│   ├── chatProcessor.ts     # Process ChatGPT exports in memory
│   ├── honchoClient.ts      # Upload to Honcho, get representations
│   └── index.ts             # Exports all core functions
│
├── file-ops/                # File system operations
│   ├── chatCleaner.ts       # File wrapper around core functions
│   ├── honchoUploader.ts    # File operations + core upload
│   ├── batchProcessor.ts    # Batch file processing utilities
│   └── index.ts             # Exports all file-ops functions
│
├── examples/                # Usage examples
│   └── frontendUsage.ts     # Lambda/frontend examples
│
└── utils/                   # Shared utilities
    ├── extractMessages.ts   # ChatGPT parsing logic
    └── analyzeUnicode.ts    # Unicode analysis tools

cli/                         # CLI wrapper scripts
├── cleanChat.ts             # Single file cleaning
├── batchClean.ts            # Batch cleaning
├── uploadChat.ts            # Single file upload
├── batchUpload.ts           # Batch upload
└── getRepresentation.ts     # Get peer representations
```

## 🎯 Clear Separation of Concerns

### **Pure JSON Functions (`src/core/`)**
- ✅ **Zero file system dependencies**
- ✅ **Perfect for Lambda/serverless**
- ✅ **Easy to test and mock**
- ✅ **Can be used anywhere**

```typescript
import { processChatData, uploadMessagesToHoncho } from '../core'

// Works in Lambda, frontend, anywhere!
const result = processChatData(jsonData)
await uploadMessagesToHoncho({ messages: result.data.messages })
```

### **File Operations (`src/file-ops/`)**
- 🗂️ **Handles all file I/O**
- 🗂️ **Calls core functions internally**
- 🗂️ **Perfect for CLI usage**
- 🗂️ **Manages file organization**

```typescript
import { cleanChatFromRaw, uploadChatToHoncho } from '../file-ops'

// Handles files, calls core functions
await cleanChatFromRaw('chat.json')           // File → Core → File
await uploadChatToHoncho({ filePath: '...' }) // File → Core → Honcho
```

## 🚀 Usage Patterns

### **For Frontend/Lambda (Use Core)**
```typescript
import { processChatData, uploadMessagesToHoncho } from '../core'

export default async function handler(req, res) {
  // Process JSON directly (no files)
  const result = processChatData(req.body.chatData)
  
  // Upload directly (no files)
  await uploadMessagesToHoncho({
    messages: result.data.messages,
    apiKey: process.env.HONCHO_API_KEY
  })
  
  res.json({ success: true })
}
```

### **For CLI/File Operations (Use File-Ops)**
```typescript
import { cleanChatFromRaw, uploadChatToHoncho } from '../file-ops'

// CLI usage with file operations
await cleanChatFromRaw('input.json')
await uploadChatToHoncho({ 
  filePath: 'cleaned.json',
  moveToProcessed: true 
})
```


## 🔄 Data Flow

### CLI Flow
```
Raw JSON File → File-Ops Function → Core Function → Result → File System
     ↓              ↓                    ↓           ↓         ↓
  chat.json → cleanChatFromRaw() → processChatData() → ✅ → clean.json
```

### Lambda Flow
```
JSON Data → Core Function → Result
    ↓           ↓             ↓
 req.body → processChatData() → ✅
```

## 🎨 Benefits of This Architecture

1. **🚀 Serverless Ready**: Core functions have zero dependencies on Node.js filesystem
2. **🧪 Easy Testing**: Pure functions are easy to test and mock
3. **♻️ Code Reuse**: Same logic works in CLI, frontend, and serverless
4. **🔒 Clear Boundaries**: File operations are completely isolated
5. **⚡ Performance**: No unnecessary file I/O in serverless environments
6. **📦 Tree Shaking**: Import only what you need
7. **🔧 Maintainability**: Clear separation makes code easier to understand and modify

## 📖 Import Guide

```typescript
// For serverless/frontend (recommended)
import { processChatData } from '../core'

// For CLI/file operations
import { cleanChatFromRaw } from '../file-ops'
```
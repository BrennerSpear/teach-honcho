# Frontend Implementation Plan: Honcho Chat Processor

## Overview

This document outlines the technical requirements and implementation plan for building a web frontend that provides all the functionality currently available in the CLI for processing ChatGPT exports and uploading them to Honcho.

## Product Requirements

### Core User Flow

1. **Landing Page**
   - Information about Honcho platform
   - Links to Honcho documentation and API key generation
   - Instructions on how to export ChatGPT conversations via email
   - Clear step-by-step guidance for users

2. **API Key Management**
   - Text input field for Honcho API key
   - Save to localStorage functionality
   - Visual obfuscation (starred out display)
   - Clear indicator when key is stored

3. **File Upload & Processing**
   - Drag-and-drop zone for `chats.json` file
   - File validation and size warnings
   - Client-side JSON parsing and cleaning
   - Batch processing with progress tracking
   - One-at-a-time upload to prevent timeouts

4. **Progress & Status Display**
   - Chat count information
   - Real-time progress bar with numbers (completed/total)
   - Upload status for each chat
   - Background processing queue status

5. **Results & Actions**
   - Link to Honcho app upon completion
   - "Get Representation" functionality with loading state
   - Queue polling for background driver tasks

## Technical Architecture

### Frontend Framework
- **Next.js 14** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible, unstyled components
- **React Hook Form** for form management
- **tRPC** for type-safe API endpoints
- **React state** (useState/useReducer) for local component state

### Component Strategy
Use **Radix UI primitives** wherever available to ensure accessibility and avoid reinventing components:
- **@radix-ui/react-progress** - Upload progress bars
- **@radix-ui/react-dialog** - Modals and confirmations
- **@radix-ui/react-alert-dialog** - Error/warning dialogs
- **@radix-ui/react-button** - All buttons
- **@radix-ui/react-form** - Form inputs and validation
- **@radix-ui/react-toast** - Success/error notifications
- **@radix-ui/react-tooltip** - Help text and guidance
- **@radix-ui/react-collapsible** - Expandable sections
- Only create custom components when Radix doesn't provide the primitive

### File Processing Constraints

#### Browser Limitations
- **Mobile Safari**: 10MB JSON parsing limit
- **General Memory**: ~150MB safe limit, up to 1.3GB possible
- **Recommended**: Split files >20MB into chunks
- **File Upload**: No browser limits (Chrome), practical limits from memory/parsing

#### Implementation Strategy
- Validate file size before processing
- Show warnings for files >50MB
- Implement chunked processing for large files (>20MB)
- Use Web Workers for heavy JSON processing
- Implement memory monitoring

### Core Functions Available
From existing codebase (`src/core/`):

1. **processChatData(jsonData)** - Pure JSON processing
2. **validateChatGPTExport(jsonData)** - Validation
3. **uploadMessagesToHoncho(options)** - Upload to Honcho
4. **getWorkingRepresentation(options)** - Get user representation

### Component Architecture

```
app/
├── page.tsx                    # Landing page
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── ui/                     # Radix UI components + custom styling
│   │   ├── Button.tsx          # Radix Button with Tailwind
│   │   ├── Input.tsx           # Radix TextField with Tailwind
│   │   ├── ProgressBar.tsx     # Radix Progress with Tailwind
│   │   ├── Dialog.tsx          # Radix Dialog
│   │   ├── Alert.tsx           # Radix AlertDialog
│   │   └── LoadingSpinner.tsx  # Custom component
│   ├── features/
│   │   ├── ApiKeyManager.tsx   # API key input & storage
│   │   ├── FileUploader.tsx    # Drag-drop zone
│   │   ├── ChatProcessor.tsx   # Processing logic
│   │   ├── ProgressTracker.tsx # Progress display
│   │   ├── QueueMonitor.tsx    # Background queue status
│   │   └── RepresentationViewer.tsx # Get representation
│   └── sections/
│       ├── HeroSection.tsx     # Landing info
│       ├── InstructionsSection.tsx # Step-by-step guide
│       └── ProcessingSection.tsx   # Main processing UI
├── hooks/
│   ├── useApiKey.ts           # localStorage API key management
│   ├── useFileProcessor.ts    # File processing logic
│   ├── useUploadQueue.ts      # Upload queue management
│   └── usePolling.ts          # Background task polling
├── lib/
│   ├── storage.ts             # localStorage utilities
│   ├── fileUtils.ts           # File validation & chunking
│   ├── workerManager.ts       # Web Worker management
│   └── constants.ts           # App constants & limits
├── workers/
│   └── chatProcessor.worker.ts # Heavy JSON processing
└── server/
    ├── api/
    │   ├── root.ts            # tRPC router setup
    │   └── routers/
    │       └── chat.ts        # Chat-related tRPC procedures
    └── trpc.ts                # tRPC configuration
```

## tRPC Procedures

### uploadChat
```typescript
const uploadChat = publicProcedure
  .input(z.object({
    messages: z.array(z.object({
      author: z.string(),
      content: z.string()
    })),
    sessionId: z.string().optional(),
    apiKey: z.string()
  }))
  .mutation(async ({ input }) => {
    // Use existing uploadMessagesToHoncho function
    return uploadMessagesToHoncho(input)
  })
```

### getRepresentation
```typescript
const getRepresentation = publicProcedure
  .input(z.object({
    peerId: z.string(),
    targetPeerId: z.string().optional(),
    apiKey: z.string()
  }))
  .query(async ({ input }) => {
    // Use existing getWorkingRepresentation function
    return getWorkingRepresentation(input)
  })
```

### Direct Honcho API Polling (No tRPC needed)
```typescript
// Frontend can poll Honcho API directly for queue status
// No CORS issues since we're using the official Honcho SDK
const pollQueueStatus = () => {
  const honcho = new Honcho({ apiKey })
  // Use Honcho SDK methods to check queue status
}
```

## State Management

### Component State (React)
```typescript
// API Key Management (custom hook)
const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null)
  
  useEffect(() => {
    const stored = localStorage.getItem('honcho-api-key')
    if (stored) setApiKey(stored)
  }, [])
  
  const saveApiKey = (key: string) => {
    localStorage.setItem('honcho-api-key', key)
    setApiKey(key)
  }
  
  return { apiKey, saveApiKey, clearApiKey: () => setApiKey(null) }
}

// Upload Progress (useReducer for complex state)
interface UploadState {
  queue: UploadItem[]
  current: number
  completed: number
  failed: UploadItem[]
  isUploading: boolean
}

const useUploadProgress = () => {
  const [state, dispatch] = useReducer(uploadReducer, initialState)
  // ... reducer logic
}
```

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Next.js project setup with TypeScript
- [ ] tRPC setup with existing configuration
- [ ] Radix UI component library setup
- [ ] Basic UI components using Radix primitives (Button, Input, Progress, Dialog, etc.)
- [ ] Custom hooks for state management
- [ ] localStorage utilities for API key
- [ ] File validation utilities

### Phase 2: File Processing
- [ ] Drag-and-drop file upload component
- [ ] File size validation and warnings
- [ ] Web Worker for JSON processing
- [ ] Chunked processing for large files
- [ ] Memory monitoring utilities

### Phase 3: tRPC Integration
- [ ] tRPC procedures for chat upload
- [ ] tRPC procedures for representation
- [ ] Direct Honcho SDK polling for queue status
- [ ] Error handling and retry logic
- [ ] Rate limiting considerations

### Phase 4: Upload Management
- [ ] Upload queue system
- [ ] Sequential upload processing
- [ ] Progress tracking UI
- [ ] Failed upload handling
- [ ] Resume functionality

### Phase 5: Advanced Features
- [ ] Background queue monitoring
- [ ] Representation display UI
- [ ] Export/import functionality
- [ ] Advanced error recovery
- [ ] Performance optimizations

### Phase 6: Polish & Testing
- [ ] Loading states and animations
- [ ] Responsive design
- [ ] Error boundary components
- [ ] Accessibility improvements
- [ ] Comprehensive testing

## File Size Handling Strategy

### Size Categories
- **Small** (< 10MB): Direct processing
- **Medium** (10-50MB): Warning + direct processing
- **Large** (50-100MB): Strong warning + chunked processing
- **Very Large** (> 100MB): Error + guidance to split file

### Processing Approach
```typescript
const handleFileProcessing = async (file: File) => {
  const sizeInMB = file.size / (1024 * 1024)
  
  if (sizeInMB > 100) {
    throw new Error('File too large. Please split into smaller files.')
  }
  
  if (sizeInMB > 50) {
    // Use Web Worker with chunked processing
    return processInChunks(file)
  }
  
  if (sizeInMB > 10) {
    // Show warning but continue
    showWarning('Large file detected. Processing may take time.')
  }
  
  return processDirectly(file)
}
```

## Security Considerations

### API Key Management
- Store in localStorage (user-controlled)
- Never log or expose in console
- Clear on logout/reset
- Validate on server-side

### File Processing
- Client-side validation only for UX
- Server-side validation required
- Sanitize all user input
- Rate limiting on API endpoints

### Error Handling
- Never expose internal errors to client
- Sanitize error messages
- Log errors securely on server
- Graceful degradation

## Performance Optimizations

### Client-Side
- Web Workers for heavy processing
- Virtual scrolling for large lists
- Debounced user input
- Lazy loading components
- Memory cleanup after processing

### Server-Side
- Connection pooling
- Request timeout handling
- Memory usage monitoring
- Proper error boundaries

## User Experience Enhancements

### Loading States
- Skeleton screens during file processing
- Progress indicators with ETAs
- Clear status messages
- Cancel operation ability

### Error Recovery
- Retry failed uploads
- Resume interrupted processes
- Clear error descriptions
- Recovery suggestions

### Accessibility
- Screen reader support
- Keyboard navigation
- High contrast mode
- Focus management

## Deployment Considerations

### Environment Variables
```bash
HONCHO_API_KEY=                 # Server-side default (optional)
NEXT_PUBLIC_HONCHO_APP_URL=     # Honcho app link
NEXT_PUBLIC_MAX_FILE_SIZE=      # File size limit
```

### Vercel Configuration
- Edge functions for API routes
- Memory optimization settings
- Request timeout configuration
- Static asset optimization

## Success Metrics

### Technical
- File processing success rate > 95%
- Average processing time < 30s for 10MB files
- Memory usage < 500MB peak
- Zero memory leaks

### User Experience
- Time to first successful upload < 2 minutes
- Error recovery rate > 90%
- User completion rate > 80%
- Mobile compatibility score > 90%

## Risk Mitigation

### Large File Handling
- **Risk**: Browser crashes with very large files
- **Mitigation**: Size limits, chunked processing, memory monitoring

### API Rate Limits
- **Risk**: Honcho API rate limiting
- **Mitigation**: Sequential uploads, retry logic, backoff strategy

### Memory Leaks
- **Risk**: Memory accumulation during processing
- **Mitigation**: Proper cleanup, Web Workers, memory monitoring

### Network Failures
- **Risk**: Upload failures due to network issues
- **Mitigation**: Retry logic, resume capability, offline detection

## Future Enhancements

### Advanced Features
- Batch file processing (multiple files)
- Chat filtering and selection
- Export processed data
- Advanced representation analysis

### Integrations
- Direct ChatGPT API integration
- Multiple platform support
- Cloud storage integration
- Webhook notifications

This implementation plan provides a comprehensive roadmap for building a robust, user-friendly frontend that matches and extends the CLI functionality while handling the unique challenges of browser-based file processing.
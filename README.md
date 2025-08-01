# Teach Honcho

A Next.js web application for uploading ChatGPT conversations to Honcho to explore AI-derived representations of you.

deployed at https://teach-honcho.brennerspear.com

## Overview

Teach Honcho provides a user-friendly web interface that allows you to:
- Upload your ChatGPT conversation exports to Honcho
- Monitor background processing of your conversations
- View AI-generated representations based on your chat history
- Track upload progress with real-time status updates

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Honcho API key from [app.honcho.dev/api-keys](https://app.honcho.dev/api-keys)
- Your ChatGPT conversation export (instructions below)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd teach-honcho

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Getting Your ChatGPT Data

1. In ChatGPT, go to **Settings → Data Controls → Export data**
2. ChatGPT will email you a zip file with your data
3. Extract the zip file and locate `conversations.json`
4. Upload this file through the Teach Honcho interface

## Features

### 🔑 API Key Management
- Secure local storage of your Honcho API key
- Connection testing with visual status indicators
- Easy key management through modal interface

### 📁 File Upload & Processing
- Drag-and-drop file upload for `conversations.json`
- Client-side JSON validation and processing
- Support for large files with memory monitoring
- Batch processing with conversation separation

### 📊 Upload Queue Management
- Real-time progress tracking for each conversation
- Upload statistics (total, pending, completed, failed)
- Retry functionality for failed uploads
- Sequential processing to prevent API timeouts

### 🔄 Background Processing Monitor
- Real-time monitoring of Honcho's background processing
- Queue status updates and progress tracking
- Automatic polling with user controls

### 🤖 AI Representations
- View Honcho's AI-generated representations of you
- Based on processed conversation data
- Updated as background processing completes

## Architecture

The application follows a clean separation between pure JSON processing and file operations:

### Core Components (`src/core/`)
- **Pure JSON processing functions** with zero file dependencies
- **Perfect for serverless environments**
- Easy to test and reuse across different contexts

### File Operations (`src/file-ops/`)
- File system operations that wrap core functions
- Handles file I/O and organization
- Used by CLI tools and local processing

### Frontend Features (`src/components/`)
- **UI Components**: Built with Radix UI primitives and Tailwind CSS
- **Upload Management**: Queue system with progress tracking
- **Real-time Updates**: WebSocket-like polling for status updates
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **API**: tRPC for type-safe endpoints
- **State Management**: React hooks (useState, useReducer)
- **Data Processing**: Web Workers for heavy JSON operations

## Performance Considerations

### File Size Handling
- **Small files** (< 10MB): Direct processing
- **Medium files** (10-50MB): Warning with direct processing
- **Large files** (50-100MB): Chunked processing with Web Workers
- **Very large files** (> 100MB): Error with guidance to split

### Memory Management
- Web Workers for heavy JSON processing
- Memory monitoring and cleanup
- Chunked processing for large datasets
- Browser-specific optimizations

## Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm check        # Run linting and type checking
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint checking

# Testing
pnpm test         # Run test suite
```

### Project Structure

```
src/
  components/
     features/        # Feature-specific components
     ui/             # Reusable UI components
     examples/       # Usage examples
  core/               # Pure JSON processing functions
  file-ops/           # File system operations
  hooks/              # Custom React hooks
  pages/              # Next.js pages
  server/             # tRPC API routes
  utils/              # Shared utilities
```

## Security

- **API Key Storage**: Local storage only, never sent to external servers
- **Client-side Validation**: Input sanitization and validation
- **Rate Limiting**: Implemented on API endpoints
- **Error Handling**: Secure error messages without internal exposure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm check` to ensure code quality
5. Submit a pull request

## License

MIT License

## Support

For issues and questions:
- Create an issue in this repository
- Check the [Honcho documentation](https://docs.honcho.dev)
- Visit [app.honcho.dev](https://app.honcho.dev) for account management
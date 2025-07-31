/**
 * Type definitions for chat processing
 */

// Unknown JSON data from uploads/API
export type UnknownJsonData = unknown

// Basic message structure
export interface ChatMessage {
  author: string
  content: string
}

// Batch chat export item
export interface ChatExportItem {
  id: string
  data: UnknownJsonData
}

// API request/response types
export interface ApiRequest {
  body: {
    chatData?: UnknownJsonData
    sessionId?: string
    [key: string]: unknown
  }
}

export interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

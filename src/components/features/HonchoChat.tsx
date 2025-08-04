"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { LoadingSpinner } from "~/components/ui/LoadingSpinner"
import { api } from "~/utils/api"

interface HonchoChatProps {
  apiKey: string
  peerId?: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  className?: string
}

interface ChatMessage {
  id: string
  type: "question" | "answer"
  content: string
  timestamp: Date
}

export function HonchoChat({
  apiKey,
  peerId = "user",
  workspaceId = "teach-honcho",
  environment = "production",
  className,
}: HonchoChatProps) {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isAsking, setIsAsking] = useState(false)

  const utils = api.useUtils()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isAsking) return

    const questionMessage: ChatMessage = {
      id: `${Date.now().toString()}-question`,
      type: "question",
      content: question.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, questionMessage])
    setIsAsking(true)

    try {
      const result = await utils.chat.askQuestion.fetch({
        peerId,
        question: question.trim(),
        apiKey,
        workspaceId,
        environment,
      })

      const answerMessage: ChatMessage = {
        id: `${Date.now().toString()}-answer`,
        type: "answer",
        content: result.answer || "No response received",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, answerMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `${Date.now().toString()}-error`,
        type: "answer",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAsking(false)
    }

    setQuestion("")
  }

  const handleClear = () => {
    setMessages([])
    setQuestion("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2 text-left">
        <h3 className="font-semibold text-foreground text-lg">
          Ask Honcho About You
        </h3>
        <p className="text-muted-foreground text-sm">
          Ask questions about your representation based on your uploaded
          conversations. Try questions like "What are my main interests?" or
          "What kind of person am I?"
        </p>
      </div>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "question" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.type === "question"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <LoadingSpinner size="sm" />
                <span className="text-muted-foreground">
                  Honcho is thinking...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Honcho a question about yourself..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isAsking || !apiKey}
          />
          <Button
            type="submit"
            disabled={!question.trim() || isAsking || !apiKey}
          >
            {isAsking ? <LoadingSpinner size="sm" /> : "Ask"}
          </Button>
        </div>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isAsking}
          >
            Clear Chat
          </Button>
        )}
      </form>

      {!apiKey && (
        <Alert>
          <AlertTitle>API Key Required</AlertTitle>
          <AlertDescription>
            Please set your Honcho API key to ask questions about your
            representation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

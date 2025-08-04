"use client"

import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { LoadingSpinner } from "~/components/ui/LoadingSpinner"
import { useQueueMonitoring } from "~/hooks/useQueueMonitoring"
import { cn } from "~/lib/utils"

interface QueueMonitorProps {
  apiKey: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  enabled?: boolean
  className?: string
  observerId?: string
  senderId?: string
  sessionId?: string
  onStatusChange?: (isProcessing: boolean) => void
}

export function QueueMonitor({
  apiKey,
  workspaceId,
  environment,
  enabled = false,
  className,
  observerId,
  senderId,
  sessionId,
  onStatusChange,
}: QueueMonitorProps) {
  const { status, error, refresh } = useQueueMonitoring({
    apiKey,
    workspaceId,
    environment,
    enabled,
    observerId,
    senderId,
    sessionId,
    pollInterval: 5000, // Poll every 5 seconds
  })

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(status.isProcessing)
  }, [status.isProcessing, onStatusChange])

  if (!enabled || !apiKey) {
    return null
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTitle>Queue Monitoring Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!status.isProcessing && status.totalWorkUnits === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-muted p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background">
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              No Active Processing
            </h3>
            <p className="text-muted-foreground text-sm">
              No work units in the queue
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>
      </div>
    )
  }

  if (!status.isProcessing && status.totalWorkUnits > 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-accent bg-primary/10 p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-accent-foreground">
              Queue Processing Complete
            </h3>
            <div className="space-y-1 text-accent-foreground text-sm">
              <p>
                All {status.totalWorkUnits} work units completed successfully
              </p>
              <p className="text-xs">
                Last updated: {status.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-primary bg-primary/10 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" className="text-primary" />
        <div className="flex-1">
          <h3 className="font-medium text-foreground">
            Processing in Background
          </h3>
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="relative w-full">
              <div className="flex h-2 overflow-hidden rounded bg-muted text-xs">
                <div
                  style={{ width: `${status.percentComplete}%` }}
                  className="flex flex-col justify-center whitespace-nowrap bg-primary text-center text-primary-foreground shadow-none transition-all duration-300"
                />
              </div>
              <p className="mt-1 font-medium text-foreground text-xs">
                {status.percentComplete}% complete
              </p>
            </div>

            {/* Work unit details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground text-sm">
              <div>
                <span className="font-medium">Total:</span>{" "}
                {status.totalWorkUnits}
              </div>
              <div>
                <span className="font-medium">Completed:</span>{" "}
                {status.completedWorkUnits}
              </div>
              <div>
                <span className="font-medium">In Progress:</span>{" "}
                {status.inProgressWorkUnits}
              </div>
              <div>
                <span className="font-medium">Pending:</span>{" "}
                {status.pendingWorkUnits}
              </div>
            </div>

            <p className="text-muted-foreground text-xs">
              Last updated: {status.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}

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
      <div className={cn("rounded-lg border border-gray-200 bg-gray-50 p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-5 w-5 text-gray-600"
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
            <h3 className="font-medium text-gray-800">No Active Processing</h3>
            <p className="text-gray-600 text-sm">
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
      <div className={cn("rounded-lg border border-green-200 bg-green-50 p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
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
            <h3 className="font-medium text-green-800">Queue Processing Complete</h3>
            <div className="space-y-1 text-green-600 text-sm">
              <p>All {status.totalWorkUnits} work units completed successfully</p>
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
    <div className={cn("rounded-lg border border-blue-200 bg-blue-50 p-4", className)}>
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" className="text-blue-600" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-800">Processing in Background</h3>
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="relative w-full">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${status.percentComplete}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
                />
              </div>
              <p className="text-blue-800 text-xs font-medium mt-1">
                {status.percentComplete}% complete
              </p>
            </div>
            
            {/* Work unit details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-600 text-sm">
              <div>
                <span className="font-medium">Total:</span> {status.totalWorkUnits}
              </div>
              <div>
                <span className="font-medium">Completed:</span> {status.completedWorkUnits}
              </div>
              <div>
                <span className="font-medium">In Progress:</span> {status.inProgressWorkUnits}
              </div>
              <div>
                <span className="font-medium">Pending:</span> {status.pendingWorkUnits}
              </div>
            </div>
            
            <p className="text-xs text-blue-500">
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
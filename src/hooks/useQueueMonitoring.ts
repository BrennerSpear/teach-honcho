"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "~/utils/api"

export interface QueueStatus {
  isProcessing: boolean
  totalWorkUnits: number
  completedWorkUnits: number
  inProgressWorkUnits: number
  pendingWorkUnits: number
  percentComplete: number
  lastUpdated: Date
}

export interface QueueMonitoringOptions {
  apiKey: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  pollInterval?: number // milliseconds
  enabled?: boolean
  observerId?: string
  senderId?: string
  sessionId?: string
}

export function useQueueMonitoring(options: QueueMonitoringOptions) {
  const [status, setStatus] = useState<QueueStatus>({
    isProcessing: false,
    totalWorkUnits: 0,
    completedWorkUnits: 0,
    inProgressWorkUnits: 0,
    pendingWorkUnits: 0,
    percentComplete: 0,
    lastUpdated: new Date(),
  })
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const utils = api.useUtils()

  const checkQueueStatus = useCallback(async () => {
    if (!options.apiKey) return

    try {
      // Get queue status via tRPC
      const result = await utils.chat.getQueueStatus.fetch({
        apiKey: options.apiKey,
        workspaceId: options.workspaceId,
        environment: options.environment,
        observerId: options.observerId,
        senderId: options.senderId,
        sessionId: options.sessionId,
      })

      const queueStatus: QueueStatus = {
        isProcessing: result.isProcessing,
        totalWorkUnits: result.totalWorkUnits,
        completedWorkUnits: result.completedWorkUnits,
        inProgressWorkUnits: result.inProgressWorkUnits,
        pendingWorkUnits: result.pendingWorkUnits,
        percentComplete: result.percentComplete,
        lastUpdated: new Date(result.lastUpdated),
      }

      setStatus(queueStatus)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check queue status",
      )
    }
  }, [
    options.apiKey,
    options.workspaceId,
    options.environment,
    options.observerId,
    options.senderId,
    options.sessionId,
    utils,
  ])

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return // Already monitoring

    const pollInterval = options.pollInterval || 5000 // Default 5 seconds

    // Initial check
    checkQueueStatus()

    // Set up polling
    intervalRef.current = setInterval(checkQueueStatus, pollInterval)
  }, [checkQueueStatus, options.pollInterval])

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Auto-start/stop monitoring based on enabled flag
  useEffect(() => {
    if (options.enabled && options.apiKey) {
      startMonitoring()
    } else {
      stopMonitoring()
    }

    return stopMonitoring
  }, [options.enabled, options.apiKey, startMonitoring, stopMonitoring])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    status,
    error,
    startMonitoring,
    stopMonitoring,
    refresh: checkQueueStatus,
  }
}

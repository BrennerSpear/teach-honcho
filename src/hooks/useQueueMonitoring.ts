"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Honcho } from "@honcho-ai/sdk"

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
  const honchoRef = useRef<Honcho | null>(null)

  // Initialize Honcho client
  useEffect(() => {
    if (options.apiKey) {
      honchoRef.current = new Honcho({
        apiKey: options.apiKey,
        workspaceId: options.workspaceId || "teach-honcho-testing",
        environment: options.environment || "production",
      })
    }
  }, [options.apiKey, options.workspaceId, options.environment])

  const checkQueueStatus = useCallback(async () => {
    if (!honchoRef.current) return

    try {
      // Get deriver status from Honcho API
      const deriverStatus = await honchoRef.current.getDeriverStatus({
        observerId: options.observerId,
        senderId: options.senderId,
        sessionId: options.sessionId,
      })

      // Calculate processing status and percentage
      const isProcessing = 
        (deriverStatus.inProgressWorkUnits > 0) || 
        (deriverStatus.pendingWorkUnits > 0)
      
      const percentComplete = deriverStatus.totalWorkUnits > 0
        ? Math.round((deriverStatus.completedWorkUnits / deriverStatus.totalWorkUnits) * 100)
        : 0

      const queueStatus: QueueStatus = {
        isProcessing,
        totalWorkUnits: deriverStatus.totalWorkUnits,
        completedWorkUnits: deriverStatus.completedWorkUnits,
        inProgressWorkUnits: deriverStatus.inProgressWorkUnits,
        pendingWorkUnits: deriverStatus.pendingWorkUnits,
        percentComplete,
        lastUpdated: new Date(),
      }

      setStatus(queueStatus)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check queue status")
    }
  }, [options.observerId, options.senderId, options.sessionId])

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
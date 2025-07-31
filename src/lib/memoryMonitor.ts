/**
 * Memory monitoring utilities for tracking memory usage during file processing
 */

export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export interface MemoryStats {
  current: MemoryInfo | null
  peak: MemoryInfo | null
  isMemoryAPISupported: boolean
}

/**
 * Get current memory information if available
 */
export function getCurrentMemoryInfo(): MemoryInfo | null {
  if (typeof window === "undefined" || !window.performance) {
    return null
  }

  // Check if the Memory API is supported
  const performanceMemory = (
    window.performance as unknown as {
      memory?: {
        usedJSHeapSize: number
        totalJSHeapSize: number
        jsHeapSizeLimit: number
      }
    }
  ).memory
  if (!performanceMemory) {
    return null
  }

  return {
    usedJSHeapSize: performanceMemory.usedJSHeapSize,
    totalJSHeapSize: performanceMemory.totalJSHeapSize,
    jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
  }
}

/**
 * Format memory size in human-readable format
 */
export function formatMemorySize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`
}

/**
 * Calculate memory usage percentage
 */
export function getMemoryUsagePercentage(memoryInfo: MemoryInfo): number {
  if (memoryInfo.jsHeapSizeLimit === 0) return 0
  return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
}

/**
 * Check if memory usage is concerning
 */
export function isMemoryUsageCritical(memoryInfo: MemoryInfo): boolean {
  const percentage = getMemoryUsagePercentage(memoryInfo)
  return percentage > 80 // Alert if over 80% memory usage
}

/**
 * Memory monitor class for tracking memory usage over time
 */
export class MemoryMonitor {
  private intervalId: number | null = null
  private memoryStats: MemoryStats = {
    current: null,
    peak: null,
    isMemoryAPISupported: getCurrentMemoryInfo() !== null,
  }
  private callbacks: Array<(stats: MemoryStats) => void> = []

  constructor() {
    this.updateMemoryStats()
  }

  /**
   * Start monitoring memory usage at regular intervals
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.intervalId !== null) {
      this.stopMonitoring()
    }

    this.intervalId = window.setInterval(() => {
      this.updateMemoryStats()
      this.notifyCallbacks()
    }, intervalMs)
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Add a callback to be notified of memory updates
   */
  onMemoryUpdate(callback: (stats: MemoryStats) => void): () => void {
    this.callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    return { ...this.memoryStats }
  }

  /**
   * Reset peak memory tracking
   */
  resetPeakMemory(): void {
    this.memoryStats.peak = this.memoryStats.current
  }

  private updateMemoryStats(): void {
    const current = getCurrentMemoryInfo()
    this.memoryStats.current = current

    // Update peak if current usage is higher
    if (current && this.memoryStats.peak) {
      if (current.usedJSHeapSize > this.memoryStats.peak.usedJSHeapSize) {
        this.memoryStats.peak = current
      }
    } else if (current) {
      this.memoryStats.peak = current
    }
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.memoryStats)
      } catch (error) {
        console.error("Error in memory monitor callback:", error)
      }
    })
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring()
    this.callbacks = []
  }
}

/**
 * Hook for using memory monitoring in React components
 */
export function createMemoryMonitorHook() {
  let monitor: MemoryMonitor | null = null

  return function useMemoryMonitor(enabled: boolean = true) {
    const [memoryStats, setMemoryStats] = useState<MemoryStats>({
      current: null,
      peak: null,
      isMemoryAPISupported: getCurrentMemoryInfo() !== null,
    })

    useEffect(() => {
      if (!enabled) return

      if (!monitor) {
        monitor = new MemoryMonitor()
      }

      const unsubscribe = monitor.onMemoryUpdate(setMemoryStats)
      monitor.startMonitoring(2000) // Update every 2 seconds

      return () => {
        unsubscribe()
        if (monitor) {
          monitor.stopMonitoring()
        }
      }
    }, [enabled])

    useEffect(() => {
      return () => {
        if (monitor) {
          monitor.destroy()
          monitor = null
        }
      }
    }, [])

    return memoryStats
  }
}

// We need to import these for the hook
import { useEffect, useState } from "react"

"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "~/utils/api"

export interface ConnectionStatus {
  connected: boolean
  apiKeyValid: boolean
  testing: boolean
  error?: string
  testedAt?: string
}

export interface UseHonchoConnectionOptions {
  apiKey?: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  autoTest?: boolean
  retestInterval?: number // in milliseconds
}

export function useHonchoConnection(options: UseHonchoConnectionOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    apiKeyValid: false,
    testing: false,
  })

  const utils = api.useUtils()

  // Extract stable values from options to avoid infinite loops
  const { apiKey, workspaceId, environment, autoTest, retestInterval } = options

  const testConnection = useCallback(async (testApiKey?: string) => {
    const keyToTest = testApiKey || apiKey
    if (!keyToTest) {
      setStatus({
        connected: false,
        apiKeyValid: false,
        testing: false,
        error: "No API key provided",
      })
      return
    }

    setStatus((prev) => ({ ...prev, testing: true, error: undefined }))

    try {
      const result = await utils.chat.checkConnection.fetch({
        apiKey: keyToTest,
        workspaceId,
        environment,
      })

      setStatus({
        connected: result.connected,
        apiKeyValid: result.apiKeyValid,
        testing: false,
        error: result.error,
        testedAt: result.testedAt,
      })
    } catch (error) {
      setStatus({
        connected: false,
        apiKeyValid: false,
        testing: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
        testedAt: new Date().toISOString(),
      })
    }
  }, [apiKey, workspaceId, environment, utils])

  // Auto-test connection when API key changes
  useEffect(() => {
    if (autoTest && apiKey) {
      testConnection()
    }
  }, [apiKey, workspaceId, environment, autoTest, testConnection])

  // Periodic retest
  useEffect(() => {
    if (!retestInterval || !apiKey || !autoTest) {
      return
    }

    const interval = setInterval(() => {
      if (status.connected) {
        testConnection()
      }
    }, retestInterval)

    return () => clearInterval(interval)
  }, [retestInterval, apiKey, autoTest, status.connected, testConnection])

  return {
    status,
    testConnection,
    isConnected: status.connected && status.apiKeyValid,
    isTesting: status.testing,
  }
}

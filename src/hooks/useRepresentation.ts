"use client"

import { useCallback, useState } from "react"
import type { WorkingRepresentation } from "~/core/honchoClient"
import { api } from "~/utils/api"

interface RepresentationOptions {
  apiKey: string
  peerId: string
  targetPeerId?: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
}

interface RepresentationState {
  isLoading: boolean
  error: string | null
  representation: WorkingRepresentation | null
  lastFetched: Date | null
}

export function useRepresentation() {
  const [state, setState] = useState<RepresentationState>({
    isLoading: false,
    error: null,
    representation: null,
    lastFetched: null,
  })

  const utils = api.useUtils()

  const fetchRepresentation = useCallback(
    async (options: RepresentationOptions) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }))

      try {
        const result = await utils.chat.getRepresentation.fetch({
          peerId: options.peerId,
          targetPeerId: options.targetPeerId,
          apiKey: options.apiKey,
          workspaceId: options.workspaceId || "teach-honcho",
          environment: options.environment || "production",
        })

        if (result?.representation) {
          setState({
            isLoading: false,
            error: null,
            representation: result.representation,
            lastFetched: new Date(),
          })
          return { success: true, representation: result.representation }
        } else {
          const errorMessage = "No representation data received"
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }))
          return { success: false, error: errorMessage }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred"
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }))
        return { success: false, error: errorMessage }
      }
    },
    [utils],
  )

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      representation: null,
      lastFetched: null,
    })
  }, [])

  const refresh = useCallback(
    async (options: RepresentationOptions) => {
      return await fetchRepresentation(options)
    },
    [fetchRepresentation],
  )

  return {
    ...state,
    fetchRepresentation,
    refresh,
    reset,
  }
}

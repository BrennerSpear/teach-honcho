"use client"

import { useCallback, useState } from "react"
import {
  getWorkingRepresentation,
  type WorkingRepresentation,
  type WorkingRepresentationOptions,
} from "~/core/honchoClient"

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

  const fetchRepresentation = useCallback(
    async (options: WorkingRepresentationOptions) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }))

      try {
        const result = await getWorkingRepresentation(options)

        if (result.success && result.representation) {
          setState({
            isLoading: false,
            error: null,
            representation: result.representation,
            lastFetched: new Date(),
          })
          return { success: true, representation: result.representation }
        } else {
          const errorMessage =
            result.message || "Failed to fetch representation"
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
    [],
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
    async (options: WorkingRepresentationOptions) => {
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

"use client"

import { useCallback, useReducer } from "react"

export interface UploadItem {
  id: string
  messages: Array<{ author: string; content: string }>
  status: "pending" | "uploading" | "completed" | "failed"
  error?: string
  sessionId?: string
}

interface UploadState {
  queue: UploadItem[]
  currentIndex: number
  isUploading: boolean
  totalItems: number
  completedItems: number
  failedItems: number
}

type UploadAction =
  | { type: "SET_QUEUE"; payload: UploadItem[] }
  | { type: "START_UPLOAD" }
  | { type: "UPLOAD_SUCCESS"; payload: { index: number; sessionId: string } }
  | { type: "UPLOAD_FAILURE"; payload: { index: number; error: string } }
  | { type: "NEXT_ITEM" }
  | { type: "RESET" }

const initialState: UploadState = {
  queue: [],
  currentIndex: -1,
  isUploading: false,
  totalItems: 0,
  completedItems: 0,
  failedItems: 0,
}

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "SET_QUEUE":
      return {
        ...state,
        queue: action.payload,
        totalItems: action.payload.length,
        currentIndex: -1,
        completedItems: 0,
        failedItems: 0,
      }

    case "START_UPLOAD":
      return {
        ...state,
        isUploading: true,
        currentIndex: 0,
      }

    case "UPLOAD_SUCCESS": {
      const { index, sessionId } = action.payload
      const newQueue = [...state.queue]
      const item = newQueue[index]
      if (!item) return state
      newQueue[index] = {
        ...item,
        status: "completed",
        sessionId,
      }
      return {
        ...state,
        queue: newQueue,
        completedItems: state.completedItems + 1,
      }
    }

    case "UPLOAD_FAILURE": {
      const { index, error } = action.payload
      const newQueue = [...state.queue]
      const item = newQueue[index]
      if (!item) return state
      newQueue[index] = {
        ...item,
        status: "failed",
        error,
      }
      return {
        ...state,
        queue: newQueue,
        failedItems: state.failedItems + 1,
      }
    }

    case "NEXT_ITEM": {
      const nextIndex = state.currentIndex + 1
      const isComplete = nextIndex >= state.totalItems

      return {
        ...state,
        currentIndex: isComplete ? -1 : nextIndex,
        isUploading: !isComplete,
      }
    }

    case "RESET":
      return initialState

    default:
      return state
  }
}

export function useUploadProgress() {
  const [state, dispatch] = useReducer(uploadReducer, initialState)

  const setQueue = useCallback((items: UploadItem[]) => {
    dispatch({ type: "SET_QUEUE", payload: items })
  }, [])

  const startUpload = useCallback(() => {
    dispatch({ type: "START_UPLOAD" })
  }, [])

  const markSuccess = useCallback((index: number, sessionId: string) => {
    dispatch({ type: "UPLOAD_SUCCESS", payload: { index, sessionId } })
  }, [])

  const markFailure = useCallback((index: number, error: string) => {
    dispatch({ type: "UPLOAD_FAILURE", payload: { index, error } })
  }, [])

  const nextItem = useCallback(() => {
    dispatch({ type: "NEXT_ITEM" })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  const getCurrentItem = useCallback(() => {
    if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
      return state.queue[state.currentIndex]
    }
    return null
  }, [state.currentIndex, state.queue])

  const getProgress = useCallback(() => {
    if (state.totalItems === 0) return 0
    return Math.round(
      ((state.completedItems + state.failedItems) / state.totalItems) * 100,
    )
  }, [state.completedItems, state.failedItems, state.totalItems])

  const getFailedItems = useCallback(() => {
    return state.queue.filter((item) => item.status === "failed")
  }, [state.queue])

  const isComplete =
    state.completedItems + state.failedItems === state.totalItems &&
    state.totalItems > 0

  return {
    ...state,
    setQueue,
    startUpload,
    markSuccess,
    markFailure,
    nextItem,
    reset,
    getCurrentItem,
    getProgress,
    getFailedItems,
    isComplete,
  }
}

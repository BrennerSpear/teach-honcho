"use client"

import { useCallback, useReducer, useRef } from "react"
import type { ProcessedChat } from "~/core/chatProcessor"
import { api } from "~/utils/api"

export interface UploadJob {
  id: string
  chat: ProcessedChat
  sessionId?: string
  status: "pending" | "uploading" | "completed" | "failed" | "retrying"
  progress: number
  error?: string
  retryCount: number
  maxRetries: number
  uploadedAt?: string
  messagesCount?: number
}

export interface UploadQueueState {
  jobs: UploadJob[]
  isProcessing: boolean
  totalJobs: number
  completedJobs: number
  failedJobs: number
  currentJob?: string
}

type UploadQueueAction =
  | { type: "ADD_JOB"; payload: { chat: ProcessedChat; sessionId?: string } }
  | { type: "START_PROCESSING" }
  | { type: "STOP_PROCESSING" }
  | { type: "UPDATE_JOB"; payload: { id: string; updates: Partial<UploadJob> } }
  | { type: "SET_CURRENT_JOB"; payload: { id?: string } }
  | { type: "CLEAR_COMPLETED" }
  | { type: "CLEAR_ALL" }
  | { type: "RETRY_FAILED" }

const initialState: UploadQueueState = {
  jobs: [],
  isProcessing: false,
  totalJobs: 0,
  completedJobs: 0,
  failedJobs: 0,
}

function uploadQueueReducer(
  state: UploadQueueState,
  action: UploadQueueAction,
): UploadQueueState {
  switch (action.type) {
    case "ADD_JOB": {
      // Generate session ID from title and create_time if not provided
      let sessionId = action.payload.sessionId

      if (
        !sessionId &&
        action.payload.chat.title &&
        action.payload.chat.create_time
      ) {
        const cleanTitle = action.payload.chat.title
          .replace(/[^a-zA-Z0-9-_\s]/g, "")
          .replace(/\s+/g, "-")
        // Convert timestamp to integer (remove decimal) to match Honcho's pattern
        const timestamp = Math.floor(action.payload.chat.create_time)
        sessionId = `${cleanTitle}-${timestamp}`
        console.log("[useUploadQueue] Generated session ID:", {
          originalTitle: action.payload.chat.title,
          cleanTitle,
          create_time: action.payload.chat.create_time,
          timestamp,
          sessionId,
        })
      }

      const job: UploadJob = {
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chat: action.payload.chat,
        sessionId,
        status: "pending",
        progress: 0,
        retryCount: 0,
        maxRetries: 3,
      }

      return {
        ...state,
        jobs: [...state.jobs, job],
        totalJobs: state.totalJobs + 1,
      }
    }

    case "START_PROCESSING":
      return {
        ...state,
        isProcessing: true,
      }

    case "STOP_PROCESSING":
      return {
        ...state,
        isProcessing: false,
        currentJob: undefined,
      }

    case "UPDATE_JOB": {
      const jobs = state.jobs.map((job) =>
        job.id === action.payload.id
          ? { ...job, ...action.payload.updates }
          : job,
      )

      const completedJobs = jobs.filter(
        (job) => job.status === "completed",
      ).length
      const failedJobs = jobs.filter((job) => job.status === "failed").length

      return {
        ...state,
        jobs,
        completedJobs,
        failedJobs,
      }
    }

    case "SET_CURRENT_JOB":
      return {
        ...state,
        currentJob: action.payload.id,
      }

    case "CLEAR_COMPLETED":
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.status !== "completed"),
        totalJobs: state.jobs.filter((job) => job.status !== "completed")
          .length,
        completedJobs: 0,
      }

    case "CLEAR_ALL":
      return initialState

    case "RETRY_FAILED":
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.status === "failed"
            ? { ...job, status: "pending", error: undefined, progress: 0 }
            : job,
        ),
        failedJobs: 0,
      }

    default:
      return state
  }
}

export interface UseUploadQueueOptions {
  apiKey: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  onJobComplete?: (job: UploadJob) => void
  onJobFailed?: (job: UploadJob) => void
  onQueueComplete?: () => void
}

export function useUploadQueue(options: UseUploadQueueOptions) {
  const [state, dispatch] = useReducer(uploadQueueReducer, initialState)
  const isProcessingRef = useRef(false)

  const uploadChatMutation = api.chat.uploadChat.useMutation()

  const updateJob = useCallback((id: string, updates: Partial<UploadJob>) => {
    dispatch({ type: "UPDATE_JOB", payload: { id, updates } })
  }, [])

  const processJob = useCallback(
    async (job: UploadJob): Promise<void> => {
      updateJob(job.id, { status: "uploading", progress: 0 })

      try {
        console.log("[useUploadQueue] Processing job:", {
          jobId: job.id,
          sessionId: job.sessionId,
          hasSessionId: !!job.sessionId,
          chatTitle: job.chat.title,
          chatCreateTime: job.chat.create_time,
          messageCount: job.chat.messages?.length,
        })

        const result = await uploadChatMutation.mutateAsync({
          messages: job.chat.messages,
          sessionId: job.sessionId,
          apiKey: options.apiKey,
          workspaceId: options.workspaceId,
          environment: options.environment,
        })

        updateJob(job.id, {
          status: "completed",
          progress: 100,
          uploadedAt: result.uploadedAt,
          messagesCount: result.messagesCount,
        })

        options.onJobComplete?.(job)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed"

        if (job.retryCount < job.maxRetries) {
          updateJob(job.id, {
            status: "retrying",
            error: errorMessage,
            retryCount: job.retryCount + 1,
          })

          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * 2 ** job.retryCount, 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))

          // Retry the job
          const updatedJob = { ...job, retryCount: job.retryCount + 1 }
          await processJob(updatedJob)
        } else {
          updateJob(job.id, {
            status: "failed",
            error: errorMessage,
            progress: 0,
          })

          options.onJobFailed?.(job)
        }
      }
    },
    [uploadChatMutation, options, updateJob],
  )

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return

    isProcessingRef.current = true
    dispatch({ type: "START_PROCESSING" })

    try {
      const pendingJobs = state.jobs.filter((job) => job.status === "pending")

      for (const job of pendingJobs) {
        if (!isProcessingRef.current) break

        dispatch({ type: "SET_CURRENT_JOB", payload: { id: job.id } })
        await processJob(job)

        // Small delay between jobs to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      options.onQueueComplete?.()
    } finally {
      isProcessingRef.current = false
      dispatch({ type: "STOP_PROCESSING" })
    }
  }, [state.jobs, processJob, options])

  const addJob = useCallback((chat: ProcessedChat, sessionId?: string) => {
    console.log("[useUploadQueue] Adding job to queue:", {
      chatTitle: chat.title,
      chatCreateTime: chat.create_time,
      providedSessionId: sessionId,
      messageCount: chat.messages?.length,
    })

    dispatch({
      type: "ADD_JOB",
      payload: { chat, sessionId },
    })
  }, [])

  const startProcessing = useCallback(() => {
    processQueue()
  }, [processQueue])

  const stopProcessing = useCallback(() => {
    isProcessingRef.current = false
    dispatch({ type: "STOP_PROCESSING" })
  }, [])

  const clearCompleted = useCallback(() => {
    dispatch({ type: "CLEAR_COMPLETED" })
  }, [])

  const clearAll = useCallback(() => {
    stopProcessing()
    dispatch({ type: "CLEAR_ALL" })
  }, [stopProcessing])

  const retryFailed = useCallback(() => {
    dispatch({ type: "RETRY_FAILED" })
  }, [])

  return {
    state,
    addJob,
    startProcessing,
    stopProcessing,
    clearCompleted,
    clearAll,
    retryFailed,
    isUploading: uploadChatMutation.isPending,
  }
}

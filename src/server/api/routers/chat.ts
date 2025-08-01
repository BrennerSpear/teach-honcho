import { Honcho } from "@honcho-ai/sdk"
import { z } from "zod"
import { getWorkingRepresentation, uploadMessagesToHoncho } from "~/core"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"

// Input validation schemas
const messageSchema = z.object({
  author: z.string(),
  content: z.string(),
})

const uploadChatSchema = z.object({
  messages: z.array(messageSchema),
  sessionId: z.string().optional(),
  apiKey: z.string(),
  workspaceId: z.string().optional(),
  environment: z.enum(["local", "production", "demo"]).optional(),
})

const batchUploadSchema = z.object({
  chatBatches: z.array(
    z.object({
      id: z.string(),
      messages: z.array(messageSchema),
      sessionId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
  apiKey: z.string(),
  workspaceId: z.string().optional(),
  environment: z.enum(["local", "production", "demo"]).optional(),
})

const representationSchema = z.object({
  peerId: z.string(),
  targetPeerId: z.string().optional(),
  apiKey: z.string(),
  workspaceId: z.string().optional(),
  environment: z.enum(["local", "production", "demo"]).optional(),
})

const queueStatusSchema = z.object({
  apiKey: z.string(),
  workspaceId: z.string().optional(),
  environment: z.enum(["local", "production", "demo"]).optional(),
  observerId: z.string().optional(),
  senderId: z.string().optional(),
  sessionId: z.string().optional(),
})

export const chatRouter = createTRPCRouter({
  // Single chat upload
  uploadChat: publicProcedure
    .input(uploadChatSchema)
    .mutation(async ({ input }) => {
      console.log("[API Router] Upload chat request received:", {
        sessionId: input.sessionId,
        messageCount: input.messages?.length,
        workspaceId: input.workspaceId,
        environment: input.environment,
        hasSessionId: !!input.sessionId,
      })

      try {
        const result = await uploadMessagesToHoncho({
          messages: input.messages,
          sessionId: input.sessionId,
          apiKey: input.apiKey,
          workspaceId: input.workspaceId,
          environment: input.environment,
        })

        if (!result.success) {
          console.error("[API Router] Upload failed:", result.message)
          throw new Error(result.message)
        }

        console.log("[API Router] Upload successful:", {
          sessionId: result.sessionId,
          messagesCount: result.messagesCount,
          uniqueAuthors: result.uniqueAuthors,
        })

        return {
          ...result,
          uploadedAt: new Date().toISOString(),
        }
      } catch (error) {
        throw new Error(
          `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }),

  // Batch upload for multiple chats
  batchUploadChats: publicProcedure
    .input(batchUploadSchema)
    .mutation(async ({ input }) => {
      const results = []
      const errors = []

      for (const batch of input.chatBatches) {
        try {
          console.log("[API Router] Batch upload item:", {
            batchId: batch.id,
            sessionId: batch.sessionId,
            messageCount: batch.messages?.length,
          })

          const result = await uploadMessagesToHoncho({
            messages: batch.messages,
            sessionId: batch.sessionId,
            apiKey: input.apiKey,
            workspaceId: input.workspaceId,
            environment: input.environment,
          })

          if (result.success) {
            results.push({
              id: batch.id,
              success: true,
              sessionId: result.sessionId,
              messagesCount: result.messagesCount,
              uploadedAt: new Date().toISOString(),
            })
          } else {
            errors.push({
              id: batch.id,
              error: result.message,
            })
          }
        } catch (error) {
          errors.push({
            id: batch.id,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }

        // Add small delay between uploads to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      return {
        success: errors.length === 0,
        totalBatches: input.chatBatches.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors,
        completedAt: new Date().toISOString(),
      }
    }),

  // Get working representation
  getRepresentation: publicProcedure
    .input(representationSchema)
    .query(async ({ input }) => {
      try {
        const result = await getWorkingRepresentation({
          peerId: input.peerId,
          targetPeerId: input.targetPeerId,
          apiKey: input.apiKey,
          workspaceId: input.workspaceId,
          environment: input.environment,
        })

        if (!result.success) {
          throw new Error(result.message || "Failed to get representation")
        }

        return {
          ...result,
          retrievedAt: new Date().toISOString(),
        }
      } catch (error) {
        throw new Error(
          `Failed to get representation: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }),

  // Health check for API connectivity
  checkConnection: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        workspaceId: z.string().optional(),
        environment: z.enum(["local", "production", "demo"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Test connection by trying to get workspace metadata
        const client = new Honcho({
          apiKey: input.apiKey,
          workspaceId: input.workspaceId || "teach-honcho",
          environment: input.environment || "production",
        })

        // This is a lightweight call that quickly verifies the API key
        await client.getMetadata()

        // If we get here, the API key is valid and connection works
        return {
          connected: true,
          apiKeyValid: true,
          testedAt: new Date().toISOString(),
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"

        // Check if it's an authentication error
        const isAuthError =
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("api key") ||
          errorMessage.toLowerCase().includes("authentication")

        return {
          connected: !isAuthError, // If it's an auth error, we did connect but key is invalid
          apiKeyValid: false,
          error: errorMessage,
          testedAt: new Date().toISOString(),
        }
      }
    }),

  // Get queue/deriver status
  getQueueStatus: publicProcedure
    .input(queueStatusSchema)
    .query(async ({ input }) => {
      try {
        const client = new Honcho({
          apiKey: input.apiKey,
          workspaceId: input.workspaceId || "teach-honcho",
          // workspaceId: input.workspaceId || "teach-honcho",
          environment: input.environment || "production",
        })

        const deriverStatus = await client.getDeriverStatus({
          observerId: input.observerId,
          senderId: input.senderId,
          sessionId: input.sessionId,
        })

        // Calculate processing status and percentage
        const isProcessing =
          deriverStatus.inProgressWorkUnits > 0 ||
          deriverStatus.pendingWorkUnits > 0

        const percentComplete =
          deriverStatus.totalWorkUnits > 0
            ? Math.round(
                (deriverStatus.completedWorkUnits /
                  deriverStatus.totalWorkUnits) *
                  100,
              )
            : 0

        return {
          isProcessing,
          totalWorkUnits: deriverStatus.totalWorkUnits,
          completedWorkUnits: deriverStatus.completedWorkUnits,
          inProgressWorkUnits: deriverStatus.inProgressWorkUnits,
          pendingWorkUnits: deriverStatus.pendingWorkUnits,
          percentComplete,
          lastUpdated: new Date().toISOString(),
        }
      } catch (error) {
        throw new Error(
          `Failed to get queue status: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    }),
})

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

export const chatRouter = createTRPCRouter({
  // Single chat upload
  uploadChat: publicProcedure
    .input(uploadChatSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await uploadMessagesToHoncho({
          messages: input.messages,
          sessionId: input.sessionId,
          apiKey: input.apiKey,
          workspaceId: input.workspaceId,
          environment: input.environment,
        })

        if (!result.success) {
          throw new Error(result.message)
        }

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
        // Test connection by trying to create a test peer
        const testPeerId = `test-${Date.now()}`
        const result = await getWorkingRepresentation({
          peerId: testPeerId,
          apiKey: input.apiKey,
          workspaceId: input.workspaceId,
          environment: input.environment,
        })

        return {
          connected: true,
          apiKeyValid: result.success || result.message !== "Unauthorized",
          testedAt: new Date().toISOString(),
        }
      } catch (error) {
        return {
          connected: false,
          apiKeyValid: false,
          error: error instanceof Error ? error.message : "Unknown error",
          testedAt: new Date().toISOString(),
        }
      }
    }),
})

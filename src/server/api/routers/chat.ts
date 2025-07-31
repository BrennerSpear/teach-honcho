import { z } from "zod"
import { getWorkingRepresentation, uploadMessagesToHoncho } from "~/core"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc"

export const chatRouter = createTRPCRouter({
  uploadChat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            author: z.string(),
            content: z.string(),
          }),
        ),
        sessionId: z.string().optional(),
        apiKey: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await uploadMessagesToHoncho({
        messages: input.messages,
        sessionId: input.sessionId,
        apiKey: input.apiKey,
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    }),

  getRepresentation: publicProcedure
    .input(
      z.object({
        peerId: z.string(),
        targetPeerId: z.string().optional(),
        apiKey: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const result = await getWorkingRepresentation({
        peerId: input.peerId,
        targetPeerId: input.targetPeerId,
        apiKey: input.apiKey,
      })

      if (!result.success) {
        throw new Error(result.message || "Failed to get representation")
      }

      return result
    }),
})

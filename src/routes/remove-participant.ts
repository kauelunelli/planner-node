import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { ClientError } from "../errors/client-error";
import { authenticate } from "../middleware/authenticate";

export async function removeParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/participants/:participantID/remove",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({
          participantID: z.string().cuid(),
        }),
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      const { participantID } = request.params;

      const participant = await prisma.participant.findUnique({
        where: {
          id: participantID,
        },
        include: {
          trip: true,
        },
      });

      if (!participant) {
        throw new ClientError("Participant not found");
      }

      if (participant.trip.userId !== userId) {
        throw new ClientError("You are not the owner of this trip");
      }
      await prisma.participant.delete({
        where: { id: participantID },
      });

      return { message: "Participant removed successfully" };
    }
  );
}
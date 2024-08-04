import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { ClientError } from "../errors/client-error";
import { authenticate } from "../controllers/auth";

export async function removeTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/trips/:tripId/remove",
    {
      // preHandler: [authenticate],
      schema: {
        params: z.object({
          tripId: z.string().cuid(),
        }),
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      const { tripId } = request.params;


      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) {
        throw new ClientError("Trip not found");
      }

      await prisma.$transaction([
        prisma.activity.deleteMany({
          where: { trip_id: tripId },
        }),
        prisma.link.deleteMany({
          where: { trip_id: tripId },
        }),
        prisma.participant.deleteMany({
          where: { trip_id: tripId },
        }),
        prisma.trip.delete({
          where: { id: tripId },
        }),
      ]);


      return { message: "Deleted" };
    }
  );
}

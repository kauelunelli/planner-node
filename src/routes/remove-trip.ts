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
      console.log("userId", userId);
      console.log("tripId", tripId);


      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) {
        throw new ClientError("Trip not found");
      }

      // if (trip.userId !== userId) {
      //   throw new ClientError("Unauthorized");
      // }
      // Your code to handle the deletion of related data or perform any necessary cleanup actions before deleting the trip
      // Delete related records in other tables
      await prisma.$transaction([
        // Deleta todas as Activities relacionadas
        prisma.activity.deleteMany({
          where: { trip_id: tripId },
        }),
        // Deleta todos os Links relacionados
        prisma.link.deleteMany({
          where: { trip_id: tripId },
        }),
        // Deleta todos os Participants relacionados
        prisma.participant.deleteMany({
          where: { trip_id: tripId },
        }),
        // Finalmente, deleta a Trip
        prisma.trip.delete({
          where: { id: tripId },
        }),
      ]);


      return { message: "Deleted" };
    }
  );
}

import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/links",
    {
      schema: {
        params: z.object({
          tripId: z.string().cuid(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          links: true
        }
      }
      );

      if (!trip) {
        throw new ClientError("Trip not found");
      }



      return trip.links.map(link => ({ id: link.id, title: link.title, url: link.url }));
    }
  );
}

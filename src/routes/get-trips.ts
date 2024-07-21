import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { authenticate } from "../controllers/auth";

export async function getTrips(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/user",
    {
      preHandler: [authenticate],
    },
    async (request) => {
      const userId = (request as any).userId;

      const user = await prisma.user.findUnique({
        select: {
          name: true,
          email: true,
          trips: {
            select: {
              id: true,
              destination: true,
            }

          }
        },
        where: {
          id: userId,
        },
      }
      );

      if (!userId) {
        throw new ClientError("User not logged in");
      }

      return { user };
    }
  );
}

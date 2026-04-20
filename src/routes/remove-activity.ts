import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { authenticate } from "../middleware/authenticate";

export async function removeActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/activities/:activityId/remove",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({
          activityId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      const { activityId } = request.params;

      const activity = await prisma.activity.findUnique({
        where: {
          id: activityId,
        },
        include: {
          trip: true,
        },
      });

      if (!activity) {
        throw new ClientError("Activity not found");
      }

      if (activity.trip.userId !== userId) {
        throw new ClientError("You are not the owner of this trip");
      }

      await prisma.activity.delete({
        where: {
          id: activityId,
        },
      });

      return { message: "Activity removed successfully" };
    }
  );
}

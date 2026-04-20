import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { authenticate } from "../middleware/authenticate";

export async function updateActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/activities/:activityId",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({
          activityId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      const { activityId } = request.params;
      const { title, occurs_at } = request.body;

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

      if (
        dayjs(occurs_at).isBefore(dayjs(activity.trip.starts_at)) ||
        dayjs(occurs_at).isAfter(dayjs(activity.trip.ends_at))
      ) {
        throw new ClientError("Activity should be within trip dates");
      }

      await prisma.activity.update({
        where: {
          id: activityId,
        },
        data: {
          title,
          occurs_at,
        },
      });

      return { activityId };
    }
  );
}

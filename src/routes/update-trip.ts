import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { authenticate } from "../middleware/authenticate";

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/trips/:tripId",
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({
          tripId: z.string().cuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          delete_out_of_range_activities: z.boolean().optional(),
        }),
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      const { tripId } = request.params;
      const {
        destination,
        starts_at,
        ends_at,
        delete_out_of_range_activities,
      } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) {
        throw new ClientError("Trip not found");
      }

      if (trip.userId !== userId) {
        throw new ClientError("You are not the owner of this trip");
      }
      if (dayjs(starts_at).isAfter(ends_at)) {
        throw new ClientError("Start date should be before end date");
      }
      if (dayjs(starts_at).isBefore(dayjs())) {
        throw new ClientError("Start date should be in the future");
      }

      const activitiesOutOfRange = await prisma.activity.findMany({
        where: {
          trip_id: tripId,
          OR: [
            {
              occurs_at: {
                lt: starts_at,
              },
            },
            {
              occurs_at: {
                gt: ends_at,
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (activitiesOutOfRange.length > 0 && !delete_out_of_range_activities) {
        throw new ClientError(
          `Changing trip dates will remove ${activitiesOutOfRange.length} activity(s) out of the new period`,
          "TRIP_UPDATE_WOULD_DELETE_ACTIVITIES"
        );
      }

      if (activitiesOutOfRange.length > 0 && delete_out_of_range_activities) {
        await prisma.activity.deleteMany({
          where: {
            id: {
              in: activitiesOutOfRange.map((activity) => activity.id),
            },
          },
        });
      }

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          destination,
          starts_at,
          ends_at,
        },
      });
      return {
        tripId,
        deletedActivities: activitiesOutOfRange.length,
      };
    }
  );
}

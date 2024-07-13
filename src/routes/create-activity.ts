import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";

export async function createActivity(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/trips/:tripId/activities",
		{
			schema: {
				params: z.object({
					tripId: z.string().cuid(),
				}),
				body: z.object({
					title: z.string().min(4),
					occurs_at: z.coerce.date(),
				}),
			},
		},
		async (request) => {
			const { tripId } = request.params;
			const { title, occurs_at } = request.body;

			const trip = await prisma.trip.findUnique({
				where: {
					id: tripId,
				},
			});

			if (!trip) {
				throw new ClientError("Trip not found");
			}

			if (
				dayjs(occurs_at).isBefore(dayjs(trip.starts_at)) ||
				dayjs(occurs_at).isAfter(dayjs(trip.ends_at))
			) {
				throw new ClientError("Activity should be within trip dates");
			}

			const activity = await prisma.activity.create({
				data: {
					title,
					occurs_at,
					trip_id: tripId,
				},
			});
			return { activityId: activity.id };
		}
	);
}

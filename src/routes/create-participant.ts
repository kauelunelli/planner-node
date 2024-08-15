import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import getMailClient from "../lib/mail";
import { ClientError } from "../errors/client-error";
import { env } from "../env";
import { authenticate } from "../middleware/authenticate";
import { dayjs } from "../lib/dayjs";

export async function createParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips/:tripId/add-participant",

    {
      preHandler: [authenticate],
      schema: {
        params: z.object({
          tripId: z.string().cuid(),
        }),
        body: z.object({
          name: z.string().min(4),
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      const userId = (request as any).userId;
      const { tripId } = request.params;
      const { name, email } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_confirmed: false,
            },
          },
        },
      });

      if (!trip) {
        throw new ClientError("Trip not found");
      }

      if (trip.userId !== userId) {
        throw new ClientError("You are not the owner of this trip");
      }

      const participant = await prisma.participant.create({
        data: {
          name,
          email,

          trip_id: tripId,
        },
      });

      const formattedStartsAt = dayjs(trip.starts_at).format("LL");
      const formattedEndsAt = dayjs(trip.ends_at).format("LL");
      const mailClient = await getMailClient();

      await Promise.all(
        trip.participants.map(async (participant) => {
          const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;
          const message = await mailClient.sendMail({
            from: {
              name: "Equipe plann.er",
              address: "oi@planner",
            },
            to: participant.email,
            subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartsAt}`,
            html: `
			
				<head>
					<style>
						body {
							font-family: Arial, sans-serif;
							background-color: #f2f2f2;
							padding: 20px;
						}
			
						.email-container {
							max-width: 600px;
							margin: 0 auto;
							background-color: #ffffff;
							padding: 20px;
							border-radius: 5px;
							box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
						}
			
						h1 {
							color: #333333;
							font-size: 24px;
							margin-bottom: 20px;
						}
			
						p {
							color: #666666;
							font-size: 16px;
							line-height: 1.5;
						}
			
						.button {
							display: inline-block;
							background-color: #007bff;
							color: #ffffff;
							padding: 10px 20px;
							text-decoration: none;
							border-radius: 5px;
							margin-top: 20px;
						}
			
						.button:hover {
							background-color: #0056b3;
						}
					</style>
				</head>
				<body>
					<div class="email-container">
						<h1>Olá!</h1>
						<p>Você foi convidado para participar de uma viagem para <strong> ${trip.destination} </strong> nas datas <string>${formattedStartsAt} até ${formattedEndsAt}</string>.</p>
						<p></p>
						<p>Para confirmar sua presença, clique no botão abaixo:!</p>
						<a href="${confirmationLink}" class="button">Confirmar viagem </a>
					</div>
				</body>
			
			`.trim(),
          });
          console.log(nodemailer.getTestMessageUrl(message));
          return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
        })
      );
    }
  )
};
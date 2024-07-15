import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import getMailClient from "../lib/mail";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { env } from "../env";
import { authenticate } from '../controllers/auth';
// const userId = getUserId(request);




export async function createTrip(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/trips",
		{
			preHandler: [authenticate],
			schema: {
				body: z.object({
					destination: z.string().min(4),
					starts_at: z.coerce.date(),
					ends_at: z.coerce.date(),
					emails_to_invite: z.array(z.string().email()).optional(),
				}),
			},
		},

		async (request) => {
			const userId = (request as any).userId;
			const {
				destination,
				starts_at,
				ends_at,
				emails_to_invite,
			} = request.body;
			if (dayjs(starts_at).isAfter(ends_at)) {
				throw new ClientError("Start date should be before end date");
			}
			if (dayjs(starts_at).isBefore(dayjs())) {
				throw new ClientError("Start date should be in the future");
			}

			if (!userId) {
				throw new ClientError("User not logged in");
			}

			const user = await prisma.user.findFirst({
				where: { id: userId },
				select: { name: true, email: true },
			});

			if (!user) {
				throw new ClientError("User does not exist");
			}

			const trip = await prisma.trip.create({
				data: {
					userId: userId,
					destination,
					starts_at,
					ends_at,
					participants: {
						createMany: {
							data: [
								{
									name: user.name,
									email: user.email,
									is_owner: true,
									is_confirmed: true,
								},
								...(emails_to_invite || []).map((email) => ({
									name: email,
									email,
									is_owner: false,
									is_confirmed: false,
								})),
							],
						},
					},
				},
			});

			const formattedStartsAt = dayjs(starts_at).format("LL");
			const formattedEndsAt = dayjs(ends_at).format("LL");

			const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`;
			const mail = await getMailClient();
			const message = await mail.sendMail({
				from: {
					name: "Equipe plann.er",
					address: "oi@planner",
				},
				to: {
					name: user.name,
					address: user.email,
				},
				subject: "Viagem criada com sucesso",
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
      <h1>Olá! ${user.name}</h1>
      <p>Você solicitou a criação de uma viagem para <strong> ${destination} </strong> nas datas <string>${formattedStartsAt} até ${formattedEndsAt}</string>.</p>
      <p></p>
      <p>Para confirmar sua viagem, clique no botão abaixo:!</p>
      <a href="${confirmationLink}" class="button">Confirmar viagem </a>
    </div>
  </body>

`.trim(),
			});
			console.log(nodemailer.getTestMessageUrl(message));
			return { tripId: trip.id };
		}
	);
}

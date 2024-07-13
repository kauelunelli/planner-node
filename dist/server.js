"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_fastify = __toESM(require("fastify"));
var import_cors = __toESM(require("@fastify/cors"));
var import_fastify_type_provider_zod = require("fastify-type-provider-zod");

// src/routes/create-trip.ts
var import_zod2 = require("zod");
var import_nodemailer2 = __toESM(require("nodemailer"));

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: ["query"]
});

// src/lib/mail.ts
var import_nodemailer = __toESM(require("nodemailer"));
async function getMailClient() {
  const account = await import_nodemailer.default.createTestAccount();
  const transporter = import_nodemailer.default.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  return transporter;
}
var mail_default = getMailClient;

// src/lib/dayjs.ts
var import_dayjs = __toESM(require("dayjs"));
var import_localizedFormat = __toESM(require("dayjs/plugin/localizedFormat"));
var import_pt_br = require("dayjs/locale/pt-br");
import_dayjs.default.locale("pt-br");
import_dayjs.default.extend(import_localizedFormat.default);

// src/errors/client-error.ts
var ClientError = class extends Error {
};

// src/env.ts
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  DATABASE_URL: import_zod.z.string().url(),
  API_BASE_URL: import_zod.z.string().url(),
  WEB_BASE_URL: import_zod.z.string().url(),
  PORT: import_zod.z.coerce.number().default(3e3)
});
var env = envSchema.parse(process.env);

// src/routes/create-trip.ts
async function createTrip(app2) {
  app2.withTypeProvider().post(
    "/trips",
    {
      schema: {
        body: import_zod2.z.object({
          destination: import_zod2.z.string().min(4),
          starts_at: import_zod2.z.coerce.date(),
          ends_at: import_zod2.z.coerce.date(),
          owner_name: import_zod2.z.string(),
          owner_email: import_zod2.z.string().email(),
          emails_to_invite: import_zod2.z.array(import_zod2.z.string().email()).optional()
        })
      }
    },
    async (request) => {
      const {
        destination,
        starts_at,
        ends_at,
        owner_name,
        owner_email,
        emails_to_invite
      } = request.body;
      if ((0, import_dayjs.default)(starts_at).isAfter(ends_at)) {
        throw new ClientError("Start date should be before end date");
      }
      if ((0, import_dayjs.default)(starts_at).isBefore((0, import_dayjs.default)())) {
        throw new ClientError("Start date should be in the future");
      }
      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  name: owner_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true
                },
                ...(emails_to_invite || []).map((email) => ({
                  name: email,
                  email,
                  is_owner: false,
                  is_confirmed: false
                }))
              ]
            }
          }
        }
      });
      const formattedStartsAt = (0, import_dayjs.default)(starts_at).format("LL");
      const formattedEndsAt = (0, import_dayjs.default)(ends_at).format("LL");
      const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`;
      const mail = await mail_default();
      const message = await mail.sendMail({
        from: {
          name: "Equipe plann.er",
          address: "oi@planner"
        },
        to: {
          name: request.body.owner_name,
          address: request.body.owner_email
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
      <h1>Ol\xE1! ${owner_name}</h1>
      <p>Voc\xEA solicitou a cria\xE7\xE3o de uma viagem para <strong> ${destination} </strong> nas datas <string>${formattedStartsAt} at\xE9 ${formattedEndsAt}</string>.</p>
      <p></p>
      <p>Para confirmar sua viagem, clique no bot\xE3o abaixo:!</p>
      <a href="${confirmationLink}" class="button">Confirmar viagem </a>
    </div>
  </body>

`.trim()
      });
      console.log(import_nodemailer2.default.getTestMessageUrl(message));
      return { tripId: trip.id };
    }
  );
}

// src/routes/confirm-trip.ts
var import_zod3 = require("zod");
var import_nodemailer3 = __toESM(require("nodemailer"));
async function confirmTrip(app2) {
  app2.withTypeProvider().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        params: import_zod3.z.object({
          tripId: import_zod3.z.string().cuid()
        })
      }
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: {
          participants: {
            where: {
              is_owner: false
            }
          }
        }
      });
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      if (trip.is_confirmed) {
        return reply.redirect(`${env.API_BASE_URL}/trips/${trip.id}`);
      }
      await prisma.trip.update({
        where: {
          id: trip.id
        },
        data: {
          is_confirmed: true
        }
      });
      const formattedStartsAt = (0, import_dayjs.default)(trip.starts_at).format("LL");
      const formattedEndsAt = (0, import_dayjs.default)(trip.ends_at).format("LL");
      const mailClient = await mail_default();
      await Promise.all(
        trip.participants.map(async (participant) => {
          const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;
          const message = await mailClient.sendMail({
            from: {
              name: "Equipe plann.er",
              address: "oi@planner"
            },
            to: participant.email,
            subject: `Confirme sua presen\xE7a na viagem para ${trip.destination} em ${formattedStartsAt}`,
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
						<h1>Ol\xE1!</h1>
						<p>Voc\xEA foi convidado para participar de uma viagem para <strong> ${trip.destination} </strong> nas datas <string>${formattedStartsAt} at\xE9 ${formattedEndsAt}</string>.</p>
						<p></p>
						<p>Para confirmar sua presen\xE7a, clique no bot\xE3o abaixo:!</p>
						<a href="${confirmationLink}" class="button">Confirmar viagem </a>
					</div>
				</body>
			
			`.trim()
          });
          console.log(import_nodemailer3.default.getTestMessageUrl(message));
          return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
        })
      );
    }
  );
}

// src/routes/confirm-participant.ts
var import_zod4 = require("zod");
async function confirmParticipant(app2) {
  app2.withTypeProvider().get(
    "/participants/:participantId/confirm",
    {
      schema: {
        params: import_zod4.z.object({
          participantId: import_zod4.z.string().cuid()
        })
      }
    },
    async (request, reply) => {
      const { participantId } = request.params;
      const participant = await prisma.participant.findUnique({
        where: {
          id: participantId
        }
      });
      if (!participant) {
        throw new ClientError("Participant not found");
      }
      if (participant.is_confirmed) {
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${participant.id}`);
      }
      await prisma.participant.update({
        where: {
          id: participant.id
        },
        data: {
          is_confirmed: true
        }
      });
      return reply.redirect(
        `${env.WEB_BASE_URL}/trips/${participant.trip_id}`
      );
    }
  );
}

// src/routes/create-activity.ts
var import_zod5 = require("zod");
async function createActivity(app2) {
  app2.withTypeProvider().post(
    "/trips/:tripId/activities",
    {
      schema: {
        params: import_zod5.z.object({
          tripId: import_zod5.z.string().cuid()
        }),
        body: import_zod5.z.object({
          title: import_zod5.z.string().min(4),
          occurs_at: import_zod5.z.coerce.date()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const { title, occurs_at } = request.body;
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }
      });
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      if ((0, import_dayjs.default)(occurs_at).isBefore((0, import_dayjs.default)(trip.starts_at)) || (0, import_dayjs.default)(occurs_at).isAfter((0, import_dayjs.default)(trip.ends_at))) {
        throw new ClientError("Activity should be within trip dates");
      }
      const activity = await prisma.activity.create({
        data: {
          title,
          occurs_at,
          trip_id: tripId
        }
      });
      return { activityId: activity.id };
    }
  );
}

// src/routes/get-activities.ts
var import_zod6 = require("zod");
async function getActivity(app2) {
  app2.withTypeProvider().get(
    "/trips/:tripId/activities",
    {
      schema: {
        params: import_zod6.z.object({
          tripId: import_zod6.z.string().cuid()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const trip = await prisma.trip.findUnique(
        {
          where: {
            id: tripId
          },
          include: {
            activities: {
              orderBy: {
                occurs_at: "asc"
              }
            }
          }
        }
      );
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      const differenceInDaysBetweenStartAndEnd = (0, import_dayjs.default)(trip.ends_at).diff(trip.starts_at, "days");
      const activities = Array.from({ length: differenceInDaysBetweenStartAndEnd + 1 }).map((_, index) => {
        const date = (0, import_dayjs.default)(trip.starts_at).add(index, "days");
        return {
          date: date.toDate(),
          activities: trip.activities.filter((activity) => {
            return (0, import_dayjs.default)(activity.occurs_at).isSame(date, "day");
          })
        };
      });
      return { activities };
    }
  );
}

// src/routes/create-link.ts
var import_zod7 = require("zod");
async function createLink(app2) {
  app2.withTypeProvider().post(
    "/trips/:tripId/links",
    {
      schema: {
        params: import_zod7.z.object({
          tripId: import_zod7.z.string().cuid()
        }),
        body: import_zod7.z.object({
          title: import_zod7.z.string().min(4),
          url: import_zod7.z.string().url()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const { title, url } = request.body;
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }
      });
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      const link = await prisma.link.create({
        data: {
          title,
          url,
          trip_id: tripId
        }
      });
      return { linkId: link.id };
    }
  );
}

// src/routes/get-links.ts
var import_zod8 = require("zod");
async function getLinks(app2) {
  app2.withTypeProvider().get(
    "/trips/:tripId/links",
    {
      schema: {
        params: import_zod8.z.object({
          tripId: import_zod8.z.string().cuid()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const trip = await prisma.trip.findUnique(
        {
          where: {
            id: tripId
          },
          include: {
            links: true
          }
        }
      );
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      return { linklist: trip.links };
    }
  );
}

// src/routes/get-participants.ts
var import_zod9 = require("zod");
async function getParticipants(app2) {
  app2.withTypeProvider().get(
    "/trips/:tripId/participants",
    {
      schema: {
        params: import_zod9.z.object({
          tripId: import_zod9.z.string().cuid()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              is_confirmed: true
            }
          }
        }
      });
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      return { participants: trip.participants };
    }
  );
}

// src/routes/create-invite.ts
var import_zod10 = require("zod");
var import_nodemailer4 = __toESM(require("nodemailer"));
async function createInvite(app2) {
  app2.withTypeProvider().post(
    "/trips/:tripId/invites",
    {
      schema: {
        params: import_zod10.z.object({
          tripId: import_zod10.z.string().cuid()
        }),
        body: import_zod10.z.object({
          email: import_zod10.z.string().email()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const { email } = request.body;
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }
      });
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      const participant = await prisma.participant.create({
        data: {
          email,
          trip_id: tripId
        }
      });
      const formattedStartsAt = (0, import_dayjs.default)(trip.starts_at).format("LL");
      const formattedEndsAt = (0, import_dayjs.default)(trip.ends_at).format("LL");
      const mailClient = await mail_default();
      const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;
      const message = await mailClient.sendMail({
        from: {
          name: "Equipe plann.er",
          address: "oi@planner"
        },
        to: participant.email,
        subject: `Confirme sua presen\xE7a na viagem para ${trip.destination} em ${formattedStartsAt}`,
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
						<h1>Ol\xE1!</h1>
						<p>Voc\xEA foi convidado para participar de uma viagem para <strong> ${trip.destination} </strong> nas datas <string>${formattedStartsAt} at\xE9 ${formattedEndsAt}</string>.</p>
						<p></p>
						<p>Para confirmar sua presen\xE7a, clique no bot\xE3o abaixo:!</p>
						<a href="${confirmationLink}" class="button">Confirmar viagem </a>
					</div>
				</body>
			
			`.trim()
      });
      console.log(import_nodemailer4.default.getTestMessageUrl(message));
      return { participantId: participant.id };
    }
  );
}

// src/routes/update-trip.ts
var import_zod11 = require("zod");
async function updateTrip(app2) {
  app2.withTypeProvider().put(
    "/trips/:tripId",
    {
      schema: {
        params: import_zod11.z.object({
          tripId: import_zod11.z.string().cuid()
        }),
        body: import_zod11.z.object({
          destination: import_zod11.z.string().min(4),
          starts_at: import_zod11.z.coerce.date(),
          ends_at: import_zod11.z.coerce.date()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const { destination, starts_at, ends_at } = request.body;
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }
      });
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      if ((0, import_dayjs.default)(starts_at).isAfter(ends_at)) {
        throw new ClientError("Start date should be before end date");
      }
      if ((0, import_dayjs.default)(starts_at).isBefore((0, import_dayjs.default)())) {
        throw new ClientError("Start date should be in the future");
      }
      await prisma.trip.update({
        where: {
          id: tripId
        },
        data: {
          destination,
          starts_at,
          ends_at
        }
      });
      return { tripId: "Meu coracao aceleraaa" };
    }
  );
}

// src/routes/get-trip-details.ts
var import_zod12 = require("zod");
async function getTripDetails(app2) {
  app2.withTypeProvider().get(
    "/trips/:tripId",
    {
      schema: {
        params: import_zod12.z.object({
          tripId: import_zod12.z.string().cuid()
        })
      }
    },
    async (request) => {
      const { tripId } = request.params;
      const trip = await prisma.trip.findUnique(
        {
          select: {
            id: true,
            destination: true,
            starts_at: true,
            ends_at: true,
            is_confirmed: true
          },
          where: {
            id: tripId
          }
        }
      );
      if (!trip) {
        throw new ClientError("Trip not found");
      }
      return { trip };
    }
  );
}

// src/routes/get-participant.ts
var import_zod13 = require("zod");
async function getParticipant(app2) {
  app2.withTypeProvider().get(
    "/participants/:participantId",
    {
      schema: {
        params: import_zod13.z.object({
          participantId: import_zod13.z.string().cuid()
        })
      }
    },
    async (request) => {
      const { participantId } = request.params;
      const participant = await prisma.participant.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          is_confirmed: true
        },
        where: {
          id: participantId
        }
      });
      if (!participant) {
        throw new ClientError("Participant not found");
      }
      return { participants: participant };
    }
  );
}

// src/error-handler.ts
var import_zod14 = require("zod");
var errorHandler = (error, request, reply) => {
  if (error instanceof import_zod14.ZodError) {
    return reply.status(400).send({
      message: "Invalid Input",
      errors: error.errors.map((error2) => error2.message)
    });
  }
  if (error instanceof ClientError) {
    return reply.status(400).send({ message: error.message });
  }
  return reply.status(500).send({ message: "Internal server error" });
};

// src/server.ts
var app = (0, import_fastify.default)();
app.register(import_cors.default, {
  origin: "*"
});
app.setValidatorCompiler(import_fastify_type_provider_zod.validatorCompiler);
app.setSerializerCompiler(import_fastify_type_provider_zod.serializerCompiler);
app.setErrorHandler(errorHandler);
app.register(createLink);
app.register(createActivity);
app.register(createTrip);
app.register(createInvite);
app.register(getActivity);
app.register(getLinks);
app.register(getParticipants);
app.register(getTripDetails);
app.register(getParticipant);
app.register(confirmTrip);
app.register(confirmParticipant);
app.register(updateTrip);
app.listen({ port: env.PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

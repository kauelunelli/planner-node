"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/confirm-trip.ts
var confirm_trip_exports = {};
__export(confirm_trip_exports, {
  default: () => confirmTrip
});
module.exports = __toCommonJS(confirm_trip_exports);
var import_zod2 = require("zod");

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

// src/routes/confirm-trip.ts
var import_nodemailer2 = __toESM(require("nodemailer"));

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

// src/routes/confirm-trip.ts
async function confirmTrip(app) {
  app.withTypeProvider().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        params: import_zod2.z.object({
          tripId: import_zod2.z.string().cuid()
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
          console.log(import_nodemailer2.default.getTestMessageUrl(message));
          return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
        })
      );
    }
  );
}

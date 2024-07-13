"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/confirm-participant.ts
var confirm_participant_exports = {};
__export(confirm_participant_exports, {
  default: () => confirmParticipant
});
module.exports = __toCommonJS(confirm_participant_exports);
var import_zod2 = require("zod");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: ["query"]
});

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

// src/routes/confirm-participant.ts
async function confirmParticipant(app) {
  app.withTypeProvider().get(
    "/participants/:participantId/confirm",
    {
      schema: {
        params: import_zod2.z.object({
          participantId: import_zod2.z.string().cuid()
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

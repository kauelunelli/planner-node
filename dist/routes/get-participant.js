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

// src/routes/get-participant.ts
var get_participant_exports = {};
__export(get_participant_exports, {
  getParticipant: () => getParticipant
});
module.exports = __toCommonJS(get_participant_exports);
var import_zod = require("zod");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: ["query"]
});

// src/errors/client-error.ts
var ClientError = class extends Error {
};

// src/routes/get-participant.ts
async function getParticipant(app) {
  app.withTypeProvider().get(
    "/participants/:participantId",
    {
      schema: {
        params: import_zod.z.object({
          participantId: import_zod.z.string().cuid()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getParticipant
});

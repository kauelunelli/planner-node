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

// src/routes/create-link.ts
var create_link_exports = {};
__export(create_link_exports, {
  createLink: () => createLink
});
module.exports = __toCommonJS(create_link_exports);
var import_zod = require("zod");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: ["query"]
});

// src/errors/client-error.ts
var ClientError = class extends Error {
};

// src/routes/create-link.ts
async function createLink(app) {
  app.withTypeProvider().post(
    "/trips/:tripId/links",
    {
      schema: {
        params: import_zod.z.object({
          tripId: import_zod.z.string().cuid()
        }),
        body: import_zod.z.object({
          title: import_zod.z.string().min(4),
          url: import_zod.z.string().url()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createLink
});

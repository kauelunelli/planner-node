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

// src/routes/get-trip-details.ts
var get_trip_details_exports = {};
__export(get_trip_details_exports, {
  getTripDetails: () => getTripDetails
});
module.exports = __toCommonJS(get_trip_details_exports);
var import_zod = require("zod");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: ["query"]
});

// src/errors/client-error.ts
var ClientError = class extends Error {
};

// src/routes/get-trip-details.ts
async function getTripDetails(app) {
  app.withTypeProvider().get(
    "/trips/:tripId",
    {
      schema: {
        params: import_zod.z.object({
          tripId: import_zod.z.string().cuid()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTripDetails
});

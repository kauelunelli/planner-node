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

// src/routes/update-trip.ts
var update_trip_exports = {};
__export(update_trip_exports, {
  updateTrip: () => updateTrip
});
module.exports = __toCommonJS(update_trip_exports);
var import_zod = require("zod");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: ["query"]
});

// src/lib/dayjs.ts
var import_dayjs = __toESM(require("dayjs"));
var import_localizedFormat = __toESM(require("dayjs/plugin/localizedFormat"));
var import_pt_br = require("dayjs/locale/pt-br");
import_dayjs.default.locale("pt-br");
import_dayjs.default.extend(import_localizedFormat.default);

// src/errors/client-error.ts
var ClientError = class extends Error {
};

// src/routes/update-trip.ts
async function updateTrip(app) {
  app.withTypeProvider().put(
    "/trips/:tripId",
    {
      schema: {
        params: import_zod.z.object({
          tripId: import_zod.z.string().cuid()
        }),
        body: import_zod.z.object({
          destination: import_zod.z.string().min(4),
          starts_at: import_zod.z.coerce.date(),
          ends_at: import_zod.z.coerce.date()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updateTrip
});

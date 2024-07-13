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

// src/routes/get-activities.ts
var get_activities_exports = {};
__export(get_activities_exports, {
  getActivity: () => getActivity
});
module.exports = __toCommonJS(get_activities_exports);
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

// src/routes/get-activities.ts
async function getActivity(app) {
  app.withTypeProvider().get(
    "/trips/:tripId/activities",
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getActivity
});

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

// src/routes/create-activity.ts
var create_activity_exports = {};
__export(create_activity_exports, {
  createActivity: () => createActivity
});
module.exports = __toCommonJS(create_activity_exports);
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

// src/routes/create-activity.ts
async function createActivity(app) {
  app.withTypeProvider().post(
    "/trips/:tripId/activities",
    {
      schema: {
        params: import_zod.z.object({
          tripId: import_zod.z.string().cuid()
        }),
        body: import_zod.z.object({
          title: import_zod.z.string().min(4),
          occurs_at: import_zod.z.coerce.date()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createActivity
});

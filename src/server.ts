import fastify from "fastify";
import cors from "@fastify/cors";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { createTrip } from "./routes/create-trip";
import confirmTrip from "./routes/confirm-trip";
import confirmParticipant from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activity";
import { getActivity } from "./routes/get-activities";
import { createLink } from "./routes/create-link";
import { getLinks } from "./routes/get-links";
import { getParticipants } from "./routes/get-participants";
import { createInvite } from "./routes/create-invite";
import { updateTrip } from "./routes/update-trip";
import { getTripDetails } from "./routes/get-trip-details";
import { getParticipant } from "./routes/get-participant";
import { errorHandler } from "./error-handler";
import { env } from "./env";
import { createUser, login } from "./controllers/auth";

const app = fastify();

app.register(cors, {
  origin: '*',
});


app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler)

app.register(createLink)
app.register(createActivity)
app.register(createTrip)
app.register(createInvite)
app.register(createUser)
app.register(login)

app.register(getActivity)
app.register(getLinks)
app.register(getParticipants)
app.register(getTripDetails)
app.register(getParticipant)

app.register(confirmTrip)
app.register(confirmParticipant)

app.register(updateTrip)


app.listen({ port: env.PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
import type { FastifyInstance } from "fastify";
import { ClientError } from "./errors/client-error";
import { ZodError } from "zod";
type FastifyErrorHandler = FastifyInstance["errorHandler"];


export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      errors: error.errors.map((error) => error.message),
    });
  }

  if (error instanceof ClientError) {
    return reply.status(400).send({
      code: error.code,
      message: error.message,
    });
  }

  console.error(error);
  return reply.status(500).send({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  });
}
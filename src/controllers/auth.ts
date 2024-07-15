import { prisma } from '../lib/prisma';
import { hashSync, compareSync } from 'bcrypt';
import { ClientError } from '../errors/client-error';
import * as jwt from 'jsonwebtoken';
import { env } from "../env";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function createUser(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/singup",
    {
      schema: {
        body: z.object({
          name: z.string().min(4),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request) => {
      const { name, email, password } = request.body;

      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        throw new ClientError("Email already in use");
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashSync(password, 10)
        }
      });


      return { user: newUser, token: jwt.sign({ userId: newUser.id }, env.JWT_SECRET) };
    }
  );
}

export async function login(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/login",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request) => {
      const { email, password } = request.body;

      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw new ClientError("User not found");
      }

      if (!compareSync(password, user.password)) {
        throw new ClientError("Invalid password");
      }

      // Store the user information in the session or any other storage mechanism
      request.userSession.set('userId', user);
      return { user, token: jwt.sign({ userId: user.id }, env.JWT_SECRET) };
    }
  );
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.split(' ')[1] // Extrai o token do cabeçalho Authorization
    console.log(token)
    if (!token) {
      return reply.status(401).send({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    (request as any).userId = decoded.userId;
  } catch (error) {
    return reply.status(403).send({ error: 'Token inválido ou expirado' });
  }
};
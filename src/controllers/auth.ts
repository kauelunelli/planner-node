import { prisma } from '../lib/prisma';
import { hashSync, compareSync } from 'bcrypt';
import { ClientError } from '../errors/client-error';
import * as jwt from 'jsonwebtoken';
import { env } from "../env";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate';


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
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw new ClientError("User not found");
      }

      if (!compareSync(password, user.password)) {
        throw new ClientError("Invalid password");
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET);

      return { user, token };
    }
  );
}

export async function logout(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/logout",
    {
      preHandler: [authenticate],
    },
    async () => {
      return { message: 'User logged out' };
    }
  );

}

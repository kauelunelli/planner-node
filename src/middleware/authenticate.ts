import * as jwt from 'jsonwebtoken';
import { env } from "../env";

interface JwtPayload {
  userId: string;
}


import { FastifyReply, FastifyRequest } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.split(' ')[1] // Extrai o token do cabeçalho Authorization
    console.log(token)
    if (!token) {
      return reply.status(401).send({ error: 'Token não fornecido' });
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (request as any).userId = decoded.userId;
  } catch (error) {
    return reply.status(403).send({ error: 'Token inválido ou expirado' });
  }
};


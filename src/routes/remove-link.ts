import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { ClientError } from "../errors/client-error";

export async function removeLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/links/:linkId/remove",
    {
      schema: {
        params: z.object({
          linkId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      const { linkId } = request.params;

      const link = await prisma.link.findUnique({
        where: {
          id: linkId,
        },
        include: {
          trip: true,
        },
      });

      if (!link) {
        throw new ClientError("Link not found");
      }

      await prisma.link.delete({
        where: { id: linkId },
      });

      return { message: "Link removed successfully" };
    }
  );
}
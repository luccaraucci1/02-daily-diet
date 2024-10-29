import { FastifyReply, FastifyRequest } from 'fastify'

export default async function checkIfSessionExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId = request.cookies.sessionId

  if (!sessionId) {
    reply.status(401).send({ message: 'Unauthorized' })
  }
}

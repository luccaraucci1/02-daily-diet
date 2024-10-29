import { FastifyRequest } from 'fastify'
import { knex } from '../database'

export default async function getUser(request: FastifyRequest) {
  const sessionId = request.cookies.sessionId

  const userResponse = await knex('users')
    .select('id')
    .where('session_id', sessionId)
    .first()

  const userId = userResponse?.id

  return userId
}

import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import checkIfSessionExists from '../middlewares/check-if-session-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserSchema = z.object({
      username: z.string(),
      password: z.string(),
    })

    const { username, password } = createUserSchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      username,
      password,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.get('/', { preHandler: checkIfSessionExists }, async (request) => {
    const sessionId = request.cookies.sessionId

    const user = await knex
      .select('*')
      .from('users')
      .where('session_id', sessionId)

    return user
  })
}

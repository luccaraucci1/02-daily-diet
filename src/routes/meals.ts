import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import getUser from '../middlewares/find-user-from-session-id'
import checkIfSessionExists from '../middlewares/check-if-session-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: checkIfSessionExists },
    async (request, reply) => {
      const createmealschema = z.object({
        name: z.string(),
        description: z.string(),
        time: z.string(),
        onDiet: z.boolean(),
      })

      const { name, description, time, onDiet } = createmealschema.parse(
        request.body,
      )

      const userId = await getUser(request)

      await knex('meals').insert({
        id: randomUUID(),
        userId,
        name,
        description,
        time,
        onDiet,
      })

      return reply.status(201).send()
    },
  )

  app.get('/', { preHandler: checkIfSessionExists }, async (request) => {
    const userId = await getUser(request)

    const meals = await knex('meals').select('*').where('userId', userId)

    return meals
  })

  app.get('/:id', { preHandler: checkIfSessionExists }, async (request) => {
    const getSpecificMealParams = z.object({
      id: z.string(),
    })

    const { id } = getSpecificMealParams.parse(request.params)

    const userId = await getUser(request)

    const meals = await knex('meals')
      .select('*')
      .where('userId', userId)
      .andWhere('id', id)

    return meals
  })

  app.get(
    '/metrics',
    { preHandler: checkIfSessionExists },
    async (request, reply) => {
      const userId = await getUser(request)

      const totalMealsCount = await knex('meals')
        .count({ total: '*' })
        .where('userId', userId)
        .first()

      const onDietSum = await knex('meals')
        .sum({ total: 'onDiet' })
        .where('userId', userId)
        .first()

      const offDietSum = Number(totalMealsCount?.total) - onDietSum?.total

      const totalMeals = await knex('meals').select('*').where('userId', userId)

      const { bestSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.onDiet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestSequence) {
            acc.bestSequence = acc.currentSequence
          }

          return acc
        },
        { currentSequence: 0, bestSequence: 0 },
      )

      return reply.status(200).send({
        totalMealsCount: totalMealsCount?.total,
        onDietSum: onDietSum?.total,
        offDietSum,
        bestSequence,
      })
    },
  )

  app.put(
    '/:id',
    { preHandler: checkIfSessionExists },
    async (request, reply) => {
      const editMealSchema = z.object({
        id: z.string(),
      })

      const userId = await getUser(request)

      const { id } = editMealSchema.parse(request.params)

      const mealSchema = z.object({
        name: z.string(),
        description: z.string(),
        onDiet: z.boolean(),
        time: z.string(),
      })

      const { name, description, onDiet, time } = mealSchema.parse(request.body)

      const meal = await knex('meals')
        .select('*')
        .where('id', id)
        .andWhere('userId', userId)
        .first()

      if (!meal) {
        return reply.status(404).send({ Error: 'Meal not found' })
      }

      await knex('meals').where('id', id).update({
        name,
        description,
        onDiet,
        time,
      })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: checkIfSessionExists },
    async (request, reply) => {
      const deleteMealSchema = z.object({
        id: z.string(),
      })

      const userId = await getUser(request)

      const { id } = deleteMealSchema.parse(request.params)

      await knex('meals').delete('*').where('id', id).andWhere('userId', userId)

      return reply.status(204).send()
    },
  )
}

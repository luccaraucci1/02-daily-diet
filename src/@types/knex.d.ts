// eslint-disable-next-line
import {Knex} from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id: string
      username: string
      password: string
    }
    meals: {
      id: string
      userId: string
      name: string
      description: string
      time: string
      onDiet: boolean
    }
  }
}

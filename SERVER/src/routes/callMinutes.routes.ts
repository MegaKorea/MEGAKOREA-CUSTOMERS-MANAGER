import { Router } from 'express'
import { addCallMinutesToTelesaleController } from '~/controllers/callMinutes.controllers'
import {
  getMinutesTelesaleExpiredTodayController,
  getMinutesTelesaleOfMonthController,
  getMinutesTelesaleTodayController
} from '~/controllers/users.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const callMinutesRoutes = Router()

callMinutesRoutes.post('/', accessTokenValidator, wrapRequestHandler(addCallMinutesToTelesaleController))
callMinutesRoutes.get('/today/:date', accessTokenValidator, wrapRequestHandler(getMinutesTelesaleTodayController))

callMinutesRoutes.get(
  '/today/expried/:date',
  accessTokenValidator,
  wrapRequestHandler(getMinutesTelesaleExpiredTodayController)
)
callMinutesRoutes.get('/month/:month', accessTokenValidator, wrapRequestHandler(getMinutesTelesaleOfMonthController))

export default callMinutesRoutes

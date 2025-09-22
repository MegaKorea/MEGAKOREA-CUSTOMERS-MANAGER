import { Router } from 'express'
import { addHistoryCallOfTelesalesController } from '~/controllers/historyCall.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const historyCallRoutes = Router()

historyCallRoutes.post('/add', accessTokenValidator, wrapRequestHandler(addHistoryCallOfTelesalesController))

export default historyCallRoutes

import { Router } from 'express'
import { getReport, getTransaction, getTransactionAfterId } from '~/controllers/reportFinance.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const reportFinanceRoutes = Router()

reportFinanceRoutes.get('/get/:month', accessTokenValidator, wrapRequestHandler(getReport))

reportFinanceRoutes.get('/transaction/:date', accessTokenValidator, wrapRequestHandler(getTransaction))

reportFinanceRoutes.get('/transaction-total', accessTokenValidator, wrapRequestHandler(getTransactionAfterId))

export default reportFinanceRoutes

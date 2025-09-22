import express from 'express'
import userRouters from '~/routes/users.routes'
import databaseService from '../services/database.services'
import { defaultErrorHandler } from './middlewares/errorsMiddlewares'
import cors from 'cors'
import customerRoutes from './routes/customers.routes'
import './utils/s3'
import searchRoutes from './routes/search.routes'
import mediasRoutes from './routes/medias.routes'
import { createServer } from 'http'
import setupSocket from './utils/socket.io'
import callMinutesRoutes from './routes/callMinutes.routes'
import historyCallRoutes from './routes/historyCall.routes'
import './cronjob/updateCustomerEpried'

import scheduleAdsRoutes from './routes/scheduleAds.routes'
import reportFinanceRoutes from './routes/reportFinance.routes'
import reportAdsRoutes from './routes/reportAds.routes'

databaseService.connect()

const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,PATCH',
  allowedHeaders: 'Content-Type,Authorization'
}

const app = express()
const httpServer = createServer(app)
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/users', userRouters)
app.use('/customers', customerRoutes)
app.use('/search', searchRoutes)
app.use('/upload', mediasRoutes)
app.use('/history-call', historyCallRoutes)
app.use('/schedule', scheduleAdsRoutes)
app.use('/report', reportFinanceRoutes)
app.use('/report/ads', reportAdsRoutes)
app.use(defaultErrorHandler)
app.use('/minutes', callMinutesRoutes)
setupSocket(httpServer)

httpServer.listen(5000, () => {
  console.log(`Server is running on http://localhost:5000`)
})

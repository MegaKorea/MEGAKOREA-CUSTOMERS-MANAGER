import { Router } from 'express'
import {
  createReport,
  getReportOfDate,
  getReportOfRangeDate,
  getRevenueOfYear
} from '~/controllers/reportAds.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const reportAdsRoutes = Router()

reportAdsRoutes.post('/create', wrapRequestHandler(createReport))

reportAdsRoutes.get('/', wrapRequestHandler(getReportOfDate))

reportAdsRoutes.post('/range-date', wrapRequestHandler(getReportOfRangeDate))

reportAdsRoutes.get('/revenue-of-year', wrapRequestHandler(getRevenueOfYear))

export default reportAdsRoutes

import { Router } from 'express'
import {
  searchCustomersByPhone,
  searchCustomersExpriedByPhone,
  searchCustomersExpriedOfTelesaleByPhone,
  searchCustomersFilter,
  searchCustomersOfTelesaleByPhone,
  searchCustomersScheduleSuccessBranchByPhoneController,
  searchCustomersScheduleSuccessBranchController
} from '~/controllers/search.controllers'
import { searchCustomerByPhoneValidator } from '~/middlewares/customer.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const searchRoutes = Router()

searchRoutes.post(
  '/by-phone',
  accessTokenValidator,
  searchCustomerByPhoneValidator,
  wrapRequestHandler(searchCustomersByPhone)
)

searchRoutes.post(
  '/by-phone-telesale',
  accessTokenValidator,
  searchCustomerByPhoneValidator,
  wrapRequestHandler(searchCustomersOfTelesaleByPhone)
)

searchRoutes.post('/by-phone-expried', accessTokenValidator, wrapRequestHandler(searchCustomersExpriedByPhone))

searchRoutes.post(
  '/by-phone-expried-of-telesale',
  accessTokenValidator,
  wrapRequestHandler(searchCustomersExpriedOfTelesaleByPhone)
)

searchRoutes.post('/fillter', accessTokenValidator, wrapRequestHandler(searchCustomersFilter))

searchRoutes.post(
  '/by-phone-success-schedule-branch',
  accessTokenValidator,
  wrapRequestHandler(searchCustomersScheduleSuccessBranchByPhoneController)
)

searchRoutes.post(
  '/by-phone-success-schedule',
  accessTokenValidator,
  wrapRequestHandler(searchCustomersScheduleSuccessBranchController)
)

searchRoutes.post(
  '/by-phone-success-schedule-branch',
  accessTokenValidator,
  wrapRequestHandler(searchCustomersScheduleSuccessBranchController)
)

export default searchRoutes

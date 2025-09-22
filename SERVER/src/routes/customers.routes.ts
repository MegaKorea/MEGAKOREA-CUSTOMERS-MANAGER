import { Router } from 'express'
import {
  addCustomerBytelesaleController,
  addCustomerController,
  deleteCustomerController,
  deleteImageBillController,
  deleteImageCustomerController,
  deleteRecordController,
  getAllanalyticsCustomerBranchOfDayController,
  getAllAnalyticsCustomerBranchsDetailsOfMonthController,
  getAllanalyticsCustomerOfDayController,
  getAllAnalyticsCustomersBranchByServiceOfMonthController,
  getAllAnalyticsCustomersBranchDetailsOfDayController,
  getAllAnalyticsCustomersByServiceOfMonthController,
  getAllAnalyticsCustomersDetailsOfDayController,
  getAllAnalyticsCustomersDetailsOfMonthController,
  getAllAnalyticsTotalCustomerBranchsDetailsOfMonthController,
  getAllCustomersController,
  getAllCustomersExpriedController,
  getAllCustomersNoPaginationController,
  getAllCustomersOfTelesaleController,
  getAllCustomersWillArrviedToDayController,
  getAllRegisterScheduleController,
  scheduleSuccessByTelesalesController,
  scheduleSuccessController,
  updateCustomerController,
  updateRegisterScheduleCustomerController,
  updateRecordController,
  getAllCustomersWillArrviedOfBranchToDayController,
  removePancakeOfCustomerController,
  analyticsCustomerBranchByServiceOfDayController,
  analyticsCustomerBranchByServiceOfMonthController,
  analyticsCustomerBranchTotalByServiceOfDayController,
  analyticsCustomerBranchTotalByServiceOfMonthController,
  updateCustomerCancleScheduleController,
  getAllAnalyticsCustomersPancakeDetailsOfDayController,
  getAllAnalyticsCustomersPancakeDetailsOfMonthController,
  getAllAnalyticsTotalCustomerBranchsDetailsOfDayController,
  getAllCustomersExpriedOfTelesaleController,
  getAllAnalyticsCustomersExpriedDetailsOfDayController,
  getAllAnalyticsCustomersDetailsSpecialServicesOfMonthController,
  TrackingCustomerController,
  TrackingCustomerContentController,
  TrackingAdsController
} from '~/controllers/customer.controllers'
import {
  addCustomerByTelesasleValidator,
  addCustomerValidator,
  deleteCustomerValidator,
  paginatonValidator,
  updateCustomerValidator
} from '~/middlewares/customer.middlewares'
import { accessTokenValidator, isAdminValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const customerRoutes = Router()

customerRoutes.post(
  '/add-customer',
  accessTokenValidator,
  addCustomerValidator,
  wrapRequestHandler(addCustomerController)
)

customerRoutes.post(
  '/add-customer-by-telesale',
  accessTokenValidator,
  addCustomerByTelesasleValidator,
  wrapRequestHandler(addCustomerBytelesaleController)
)

customerRoutes.post('/all', accessTokenValidator, paginatonValidator, wrapRequestHandler(getAllCustomersController))

customerRoutes.post(
  '/all-customer-of-telesale',
  paginatonValidator,
  accessTokenValidator,
  wrapRequestHandler(getAllCustomersOfTelesaleController)
)

customerRoutes.post(
  '/all-customer-exprired-of-telesale',
  paginatonValidator,
  accessTokenValidator,
  wrapRequestHandler(getAllCustomersExpriedOfTelesaleController)
)

customerRoutes.get(
  '/all-customer-no-paginate',
  accessTokenValidator,
  wrapRequestHandler(getAllCustomersNoPaginationController)
)

customerRoutes.post('/all-customer-expried', accessTokenValidator, wrapRequestHandler(getAllCustomersExpriedController))

customerRoutes.get('/all-register-schedule', accessTokenValidator, wrapRequestHandler(getAllRegisterScheduleController))

customerRoutes.patch(
  '/update-customer',
  accessTokenValidator,
  updateCustomerValidator,
  wrapRequestHandler(updateCustomerController)
)

customerRoutes.get('/update-customer-schedule-expried', wrapRequestHandler(updateRegisterScheduleCustomerController))

customerRoutes.get(
  '/analytics-customer-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllanalyticsCustomerOfDayController)
)

customerRoutes.get(
  '/analytics-customer-details-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersDetailsOfDayController)
)

customerRoutes.get(
  '/analytics-customer-expried-details-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersExpriedDetailsOfDayController)
)

customerRoutes.get(
  '/analytics-customer-pancake-details-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersPancakeDetailsOfMonthController)
)

customerRoutes.get(
  '/analytics-customer-pancake-details-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersPancakeDetailsOfDayController)
)

customerRoutes.get(
  '/analytics-customer-details-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersDetailsOfMonthController)
)

customerRoutes.get(
  '/analytics-customer-details-special-services-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersDetailsSpecialServicesOfMonthController)
)

customerRoutes.get(
  '/analytics-customer-by-service-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersByServiceOfMonthController)
)

customerRoutes.get(
  '/analytics-customer-branch-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllanalyticsCustomerBranchOfDayController)
)

customerRoutes.get(
  '/analytics-customer-branch-details-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersBranchDetailsOfDayController)
)

customerRoutes.get(
  '/analytics-customer-branch-details-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomerBranchsDetailsOfMonthController)
)

customerRoutes.get(
  '/analytics-total-customer-branch-details-of-day',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsTotalCustomerBranchsDetailsOfDayController)
)

customerRoutes.get(
  '/analytics-total-customer-branch-details-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsTotalCustomerBranchsDetailsOfMonthController)
)

customerRoutes.get(
  '/analytics-customer-branch-by-service-of-month',
  accessTokenValidator,
  wrapRequestHandler(getAllAnalyticsCustomersBranchByServiceOfMonthController)
)

customerRoutes.post(
  '/all-customer-will-arrvied-to-day',
  accessTokenValidator,
  wrapRequestHandler(getAllCustomersWillArrviedToDayController)
)

customerRoutes.get(
  '/all-customer-of-branch-will-arrvied-to-day',
  accessTokenValidator,
  wrapRequestHandler(getAllCustomersWillArrviedOfBranchToDayController)
)

customerRoutes.post(
  '/schedule-success',
  accessTokenValidator,
  paginatonValidator,
  wrapRequestHandler(scheduleSuccessController)
)

customerRoutes.post(
  '/schedule-telesales-success',
  accessTokenValidator,
  paginatonValidator,
  wrapRequestHandler(scheduleSuccessByTelesalesController)
)

customerRoutes.post('/update-record', accessTokenValidator, wrapRequestHandler(updateRecordController))

customerRoutes.delete(
  '/:customer_id',
  accessTokenValidator,
  isAdminValidator,
  deleteCustomerValidator,
  wrapRequestHandler(deleteCustomerController)
)

customerRoutes.post('/delete-record', accessTokenValidator, wrapRequestHandler(deleteRecordController))

customerRoutes.post('/delete-image-customer', accessTokenValidator, wrapRequestHandler(deleteImageCustomerController))

customerRoutes.post('/delete_image-bill', accessTokenValidator, wrapRequestHandler(deleteImageBillController))

customerRoutes.delete(
  '/remove-pancake-of-customer/:customer_id',
  accessTokenValidator,
  wrapRequestHandler(removePancakeOfCustomerController)
)

customerRoutes.get(
  '/analytics-customer-branch-by-service-of-day-exclude-telesale',
  accessTokenValidator,
  wrapRequestHandler(analyticsCustomerBranchByServiceOfDayController)
)

customerRoutes.get(
  '/analytics-customer-branch-by-service-of-month-exclude-telesale',
  accessTokenValidator,
  wrapRequestHandler(analyticsCustomerBranchByServiceOfMonthController)
)

customerRoutes.get(
  '/analytics-customer-branch-total-by-service-of-day-exclude-telesale',
  accessTokenValidator,
  wrapRequestHandler(analyticsCustomerBranchTotalByServiceOfDayController)
)

customerRoutes.get(
  '/analytics-customer-branch-total-by-service-of-month-exclude-telesale',
  accessTokenValidator,
  wrapRequestHandler(analyticsCustomerBranchTotalByServiceOfMonthController)
)

customerRoutes.get('/update-customer-cancle-schedule', wrapRequestHandler(updateCustomerCancleScheduleController))

customerRoutes.post('/traking', accessTokenValidator, wrapRequestHandler(TrackingCustomerController))

customerRoutes.post('/traking-content', accessTokenValidator, wrapRequestHandler(TrackingCustomerContentController))

customerRoutes.get('/tracking-ads', wrapRequestHandler(TrackingAdsController))

export default customerRoutes

import { HttpStatusCode } from '~/constants/enum'
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import customerService from '../../services/customers.services'
import { customerMessages } from '~/constants/messages'
import {
  CustomerAnalyticsOfDayRequestParams,
  CustomerRequestBody,
  CustomerUpdateType
} from '~/models/requestes/Customer.requests'
import { TokenPayload } from '~/models/requestes/User.requests'
import { SearchCustomersFillterRequest } from '~/models/requestes/Search.requests'

export const addCustomerController = async (
  req: Request<ParamsDictionary, any, CustomerRequestBody>,
  res: Response
) => {
  const result = await customerService.addCustomer(req.body)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ADD_CUSTOMER_SUCCESS,
    result
  })
}

export const addCustomerBytelesaleController = async (
  req: Request<ParamsDictionary, any, CustomerRequestBody>,
  res: Response
) => {
  const result = await customerService.addCustomer(req.body)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ADD_CUSTOMER_SUCCESS,
    result
  })
}

export const getAllCustomersController = async (
  req: Request<ParamsDictionary, any, SearchCustomersFillterRequest>,
  res: Response
) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const filter = req.body
  const result = await customerService.getAllCustomers({ page, limit, filter })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_SUCCESS,
    result: {
      customers: result.result,
      total: result.total,
      limit,
      page
    }
  })
}

export const getAllCustomersNoPaginationController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const result = await customerService.getAllCustomersNoPagination()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_OF_TELESALE_SUCCESS,
    result
  })
}

export const getAllCustomersOfTelesaleController = async (
  req: Request<ParamsDictionary, any, SearchCustomersFillterRequest>,
  res: Response
) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const filter = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await customerService.getAllCustomersOfTelesale({ telesale_id: user_id, page, limit, filter })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_OF_TELESALE_SUCCESS,
    result: {
      customers: result.result,
      total: result.total,
      limit,
      page
    }
  })
}

export const getAllCustomersExpriedOfTelesaleController = async (
  req: Request<ParamsDictionary, any, SearchCustomersFillterRequest>,
  res: Response
) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const filter = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await customerService.getAllCustomersExpriedOfTelesale({ telesale_id: user_id, page, limit, filter })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_EXPRIED_OF_TELESALE_SUCCESS,
    result: {
      customers: result.customers,
      total: result.total,
      limit,
      page
    }
  })
}

export const updateCustomerController = async (
  req: Request<ParamsDictionary, any, CustomerUpdateType>,
  res: Response
) => {
  await customerService.updateCustomer(req.body)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.UPDATE_CUSTOMER_SUCCESS
  })
}

export const transitonCustomerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id, telesale_id_old, telesale_id_new, date } = req.body
  await customerService.transitonCustomer({ customer_id, telesale_id_old, telesale_id_new, date })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.TRANSITION_CUSTOMER_SUCCESS
  })
}

export const removeCustomerFromTelesaleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id, telesale_id } = req.body
  await customerService.removeCustomerFromTelesale({ customer_id, telesale_id })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.TRANSITION_CUSTOMER_SUCCESS
  })
}

export const getAllCustomersExpriedController = async (
  req: Request<ParamsDictionary, any, SearchCustomersFillterRequest>,
  res: Response
) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const filter = req.body
  const result = await customerService.getAllCustomersExpired({ page, limit, filter })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_EXPRIED_SUCCESS,
    result
  })
}

export const updateRegisterScheduleCustomerController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  await customerService.updateRegisterScheduleCustomer()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.UPDATE_CUSTOMER_SUCCESS
  })
}

export const getAllRegisterScheduleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await customerService.getAllRegisterSchedule(user_id)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_REGISTER_SCHEDULE_SUCCESS,
    result: {
      customers: result
    }
  })
}

export const getAllanalyticsCustomerOfDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const date = req.query.date
  const result = await customerService.getAllanalyticsCustomerOfDay(date as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersDetailsOfDayController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const date = req.query.date
  const result = await customerService.getAllAnalyticsCustomersDetailsOfDay(date as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersExpriedDetailsOfDayController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const date = req.query.date
  const result = await customerService.getAllAnalyticsCustomersExpriedDetailsOfDay(date as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersPancakeDetailsOfDayController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const date = req.query.date
  const result = await customerService.getAllAnalyticsCustomersPancakeDetailsOfDay(date as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersDetailsOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const month = req.query.month
  const result = await customerService.getAllAnalyticsCustomersDetailsOfMonth(month as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersDetailsSpecialServicesOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const month = req.query.month
  const result = await customerService.getAllAnalyticsCustomersDetailsSpecialServicesOfMonthS(month as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersPancakeDetailsOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const month = req.query.month
  const result = await customerService.getAllAnalyticsCustomersPancakeDetailsOfMonth(month as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersByServiceOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const month = req.query.month
  const result = await customerService.getAllAnalyticsCustomersByServiceOfMonth(month as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersBranchDetailsOfDayController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const { date, branch } = req.query
  const result = await customerService.getAllAnalyticsBranchCustomersDetailsOfDay(date as string, branch as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomerBranchsDetailsOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const { month, branch } = req.query
  const result = await customerService.getAllAnalyticsCustomersBranchDetailsOfMonth(month as string, branch as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsTotalCustomerBranchsDetailsOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const { month } = req.query
  const result = await customerService.getAllAnalyticsTotalBranchDetailsOfMonth(month as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsTotalCustomerBranchsDetailsOfDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { date } = req.query

  const result = await customerService.getAllAnalyticsTotalBranchDetailsOfDay(date as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllAnalyticsCustomersBranchByServiceOfMonthController = async (
  req: Request<ParamsDictionary, any, CustomerAnalyticsOfDayRequestParams>,
  res: Response
) => {
  const { month, branch } = req.query
  const result = await customerService.getAllAnalyticsCustomersBranchByServiceOfMonth(month as string, branch as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const getAllanalyticsCustomerBranchOfDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { date, branch } = req.query
  const result = await customerService.getAllanalyticsCustomerBranchOfDay(date as string, branch as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_OF_DAY_SUCCESS,
    result
  })
}

export const scheduleSuccessController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { role } = req.decode_authorization as TokenPayload
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const filter = req.body
  if (!role) {
    return res.status(HttpStatusCode.BadRequest).json({
      success: false,
      message: 'Role is required'
    })
  }
  const result = await customerService.scheduleSuccess({ role, page, limit, filter })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_SCHEDULE_SUCCESS,
    result: {
      customers: result.result,
      total: result.total,
      limit,
      page
    }
  })
}

export const updateRecordController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id, record } = req.body
  const result = await customerService.updateRecord({ customer_id, record })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.UPDATE_RECORD_SUCCESS,
    result
  })
}

export const scheduleSuccessByTelesalesController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const filter = req.body
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const result = await customerService.scheduleSuccessByTelesales({ filter, limit, page })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_SCHEDULE_SUCCESS,
    result: {
      customers: result.result,
      total: result.total,
      limit,
      page
    }
  })
}

export const deleteCustomerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const customer_id = req.params.customer_id
  await customerService.deleteCustomer(customer_id)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.DELETE_CUSTOMER_SUCCESS
  })
}

export const deleteRecordController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id, record } = req.body
  await customerService.deleteRecord({ customer_id, record })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.DELETE_RECORD_SUCCESS
  })
}

export const deleteImageCustomerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id, media } = req.body
  await customerService.deleteImageCustomer({ customer_id, media })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.DELETE_IMAGE_CUSTOMER_SUCCESS
  })
}

export const deleteImageBillController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id, bill_media } = req.body
  await customerService.deleteImageBill({ customer_id, bill_media })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.DELETE_IMAGE_CUSTOMER_SUCCESS
  })
}

export const getAllCustomersWillArrviedToDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { today } = req.body
  const result = await customerService.getAllCustomersWillArriveToday(today)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_WILL_ARRIVED_TO_DAY_SUCCESS,
    result
  })
}

export const getAllCustomersWillArrviedOfBranchToDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { branch } = req.query
  const today = new Date().toISOString().split('T')[0]
  const result = await customerService.getAllCustomersWillArriveOfBranchToday(today, branch as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.GET_ALL_CUSTOMERS_WILL_ARRIVED_TO_DAY_SUCCESS,
    result
  })
}

export const removePancakeOfCustomerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { customer_id } = req.params
  await customerService.removePancakeOfCustomer(customer_id)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.REMOVE_PANCAKE_OF_CUSTOMER_SUCCESS
  })
}

export const analyticsCustomerBranchByServiceOfDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { date, branch } = req.query
  const result = await customerService.analyticsCustomerBranchByServiceOfDay({
    date: date as string,
    branch: branch as string
  })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_BRANCH_BY_SERVICE_OF_DAY_SUCCESS,
    result
  })
}

export const analyticsCustomerBranchByServiceOfMonthController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { date, branch } = req.query
  const result = await customerService.analyticsCustomerBranchByServiceOfMonth({
    date: date as string,
    branch: branch as string
  })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_BRANCH_BY_SERVICE_OF_MONTH_SUCCESS,
    result
  })
}

export const analyticsCustomerBranchTotalByServiceOfDayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { date } = req.query
  const result = await customerService.analyticsCustomerBranchTotalByServiceOfDay({
    date: date as string
  })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_BRANCH_BY_SERVICE_OF_DAY_SUCCESS,
    result
  })
}

export const analyticsCustomerBranchTotalByServiceOfMonthController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { date } = req.query
  const result = await customerService.analyticsCustomerBranchTotalByServiceOfMonth({
    date: date as string
  })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.ANALYTICS_CUSTOMER_BRANCH_BY_SERVICE_OF_MONTH_SUCCESS,
    result
  })
}

export const updateCustomerCancleScheduleController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  await customerService.updateCustomersCanceled()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.UPDATE_CUSTOMER_SUCCESS
  })
}

export const TrackingCustomerController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { date } = req.body
  const result = await customerService.TrackingCustomer(date)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.TRACKING_CUSTOMER_SUCCESS,
    result
  })
}

export const TrackingCustomerContentController = async (
  req: Request<
    ParamsDictionary,
    any,
    {
      ad: string[]
      date: string
      branch?: string
    }
  >,
  res: Response
) => {
  const { ad, date, branch } = req.body
  const result = await customerService.TrackingCustomerContent(ad, date, branch)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.TRACKING_CUSTOMER_CONTENT_SUCCESS,
    result
  })
}

export const TrackingAdsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { ad_id, date_preset } = req.query as {
    ad_id: string
    date_preset: string
  }
  const result = await customerService.TrackingAds(ad_id, date_preset)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.TRACKING_ADS_SUCCESS,
    result
  })
}

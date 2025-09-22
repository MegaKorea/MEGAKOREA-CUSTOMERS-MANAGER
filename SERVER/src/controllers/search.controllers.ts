import { HttpStatusCode } from 'axios'
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import searchServices from '../../services/search.services'
import { SearchCustomersByPhoneRequest, SearchCustomersFillterRequest } from '~/models/requestes/Search.requests'
import { customerMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requestes/User.requests'

export const searchCustomersByPhone = async (
  req: Request<ParamsDictionary, any, SearchCustomersByPhoneRequest>,
  res: Response
) => {
  const { phone } = req.body
  const result = await searchServices.searchByPhone(phone)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_BY_PHONE_SUCCESS,
    result
  })
}

export const searchCustomersOfTelesaleByPhone = async (
  req: Request<ParamsDictionary, any, SearchCustomersByPhoneRequest>,
  res: Response
) => {
  const { phone } = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await searchServices.searchCustomersOfTelesaleByPhone(phone, user_id)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_BY_PHONE_SUCCESS,
    result
  })
}

export const searchCustomersFilter = async (
  req: Request<ParamsDictionary, any, SearchCustomersFillterRequest>,
  res: Response
) => {
  const fillter = req.body
  const result = await searchServices.searchByFilter(fillter)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_FILTER_SUCCESS,
    result
  })
}

export const searchCustomersExpriedByPhone = async (
  req: Request<ParamsDictionary, any, SearchCustomersByPhoneRequest>,
  res: Response
) => {
  const { phone } = req.body
  const result = await searchServices.searchCustomersExpriedByPhone(phone)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_BY_PHONE_SUCCESS,
    result
  })
}

export const searchCustomersExpriedOfTelesaleByPhone = async (
  req: Request<ParamsDictionary, any, SearchCustomersByPhoneRequest>,
  res: Response
) => {
  const { phone } = req.body
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await searchServices.searchCustomersExpriedOfTelesaleByPhone({ phone, user_id })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_BY_PHONE_SUCCESS,
    result
  })
}

export const searchCustomersScheduleSuccessBranchByPhoneController = async (
  req: Request<ParamsDictionary, any, SearchCustomersByPhoneRequest>,
  res: Response
) => {
  const { role } = req.decode_authorization as TokenPayload
  const { phone } = req.body
  if (!role) {
    return res.status(HttpStatusCode.BadRequest).json({
      success: false,
      message: 'Role is required'
    })
  }
  const result = await searchServices.searchCustomersScheduleSuccessBranchByPhone({ phone, role })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_FILTER_SUCCESS,
    result
  })
}

export const searchCustomersScheduleSuccessBranchController = async (
  req: Request<ParamsDictionary, any, SearchCustomersByPhoneRequest>,
  res: Response
) => {
  const { phone } = req.body
  const { role } = req.decode_authorization as TokenPayload
  if (!role) {
    return res.status(HttpStatusCode.BadRequest).json({
      success: false,
      message: 'Role is required'
    })
  }
  const result = await searchServices.searchCustomersScheduleSuccessBranch({ phone, role })
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: customerMessages.SEARCH_CUSTOMER_FILTER_SUCCESS,
    result
  })
}

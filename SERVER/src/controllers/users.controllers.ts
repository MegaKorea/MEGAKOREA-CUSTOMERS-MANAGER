import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '../../services/users.services'
import {
  AddCustomerToTelesaleRequestBody,
  LoginRequestBody,
  RegisterRequestBody,
  UpdateAtcRequestBody,
  UpdateBranchRequestBody,
  UpdateStatusRequestBody
} from '~/models/requestes/User.requests'
import { HttpStatusCode } from '~/constants/enum'
import { userMessages } from '~/constants/messages'
import { ObjectId } from 'mongodb'

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const { user } = req
  const user_id = user?._id as ObjectId
  const role = user?.role
  const result = await usersService.login(user_id.toHexString(), role as string)

  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersService.register(req.body)
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.REGISTER_SUCCESS,
    result
  })
}

export const getAllTelesalesController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await usersService.getAllTelesales()
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_ALL_USERS_SUCCESS,
    result
  })
}

export const getMeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user } = req
  const user_id = user?._id as ObjectId
  const result = await usersService.getMe(user_id.toHexString())
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_ALL_USERS_SUCCESS,
    result
  })
}

export const getAllFbAdsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await usersService.getAllFbAds()
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_ALL_USERS_SUCCESS,
    result
  })
}

export const addCustomerToTelesaleController = async (
  req: Request<ParamsDictionary, any, AddCustomerToTelesaleRequestBody>,
  res: Response
) => {
  const result = await usersService.addCustomerToTelesale({
    customer_id: req.body.customer_id,
    telesale_id: req.body.telesale_id,
    date: req.body.date
  })
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.ADD_CUSTOMER_TO_TELESALE_SUCCESS,
    result
  })
}

export const getAllPancakeController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await usersService.getAllPancake()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_ALL_PANCAKE_SUCCESS,
    result
  })
}

export const updateStatusUserController = async (
  req: Request<ParamsDictionary, any, UpdateStatusRequestBody>,
  res: Response
) => {
  const { user } = req
  const { status } = req.body
  const user_id = user?._id as ObjectId
  const result = await usersService.updateStatusUser(user_id.toHexString(), status)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.UPDATE_STATUS_USER_SUCCESS,
    result
  })
}

export const updateBranchUserController = async (
  req: Request<ParamsDictionary, any, UpdateBranchRequestBody>,
  res: Response
) => {
  const { branch, user_id } = req.body
  const result = await usersService.updateBranchUser(user_id, branch)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.UPDATE_BRANCH_USER_SUCCESS,
    result
  })
}

export const updateAtcUserController = async (
  req: Request<ParamsDictionary, any, UpdateAtcRequestBody>,
  res: Response
) => {
  const { atc, user_id } = req.body
  const result = await usersService.updateAtcUser(user_id, atc)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.UPDATE_ATC_USER_SUCCESS,
    result
  })
}

export const deleteUserController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { telesale_id } = req.params
  const result = await usersService.deleteUser(telesale_id)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.DELETE_USER_SUCCESS,
    result
  })
}

export const getMinutesTelesaleTodayController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const date = req.params.date
  const result = await usersService.getMinutesTelesaleToday(date)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_MINUTES_TELESALE_TODAY_SUCCESS,
    result
  })
}

export const getMinutesTelesaleExpiredTodayController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const date = req.params.date
  const result = await usersService.getMinutesTelesaleExpiredToday(date)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_MINUTES_TELESALE_TODAY_SUCCESS,
    result
  })
}

export const getMinutesTelesaleOfMonthController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const month = req.params.month
  const result = await usersService.getMinutesTelesaleOfMonth(month)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_MINUTES_TELESALE_MONTH_SUCCESS,
    result
  })
}

export const getBranchOfTelesalesController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await usersService.getBranchOfTelesales()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_BRANCH_OF_TELESALES_SUCCESS,
    result
  })
}

export const updateBranchOfTelesalesController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id, data } = req.body
  const result = await usersService.updateBranchOfTelesales(id, data)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.UPDATE_BRANCH_OF_TELESALES_SUCCESS,
    result
  })
}

export const getBranchOfTelesales = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await usersService.getBranchOfTelesales()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.GET_BRANCH_OF_TELESALES_SUCCESS,
    result
  })
}

export const transitionCustomerToTelesaleAutoController = async (req: Request, res: Response) => {
  const { customer_id, telesale_id } = req.body
  // const result = await usersService.transitionCustomerToTelesaleAuto(customer_id, telesale_id)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.TRANSITION_CUSTOMER_TO_TELESALE_AUTO_SUCCESS
    // result
  })
}

import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import historyCallServices from '../../services/historyCall.services'
import { HttpStatusCode } from '~/constants/enum'
import { userMessages } from '~/constants/messages'
import { HistoryCallOfTelesalesRequestBody } from '~/models/requestes/HistoryCall.requests'

export const addHistoryCallOfTelesalesController = async (
  req: Request<ParamsDictionary, any, HistoryCallOfTelesalesRequestBody>,
  res: Response
) => {
  const result = await historyCallServices.addHistoryCallOfTelesales(req.body)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.ADD_HISTORY_CALL_OF_TELESALES_SUCCESS,
    result
  })
}

// export const getAllHistoryCallOfTelesalesController = async (
//   req: Request<ParamsDictionary, any, any>,
//   res: Response
// ) => {
//   const result = await historyCallServices.getHistoryCallOfTelesales()
//   res.status(HttpStatusCode.Ok).json({
//     success: true,
//     message: userMessages.HISTORY_CALL_OF_TELESALES_SUCCESS,
//     result
//   })
// }

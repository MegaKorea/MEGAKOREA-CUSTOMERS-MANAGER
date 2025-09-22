import { HttpStatusCode } from 'axios'
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { userMessages } from '~/constants/messages'
import callMinutesOfTelesalesService from '../../services/callMinutes.services'
export const addCallMinutesToTelesaleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await callMinutesOfTelesalesService.addCallMinutesToTelesale(req.body)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.ADD_CALL_MINUTES_SUCCESS,
    result
  })
}

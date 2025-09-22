import { HttpStatusCode } from 'axios'
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import reportAdsServices from '../../services/reportAds.services'

export const createReport = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await reportAdsServices.CreateReportAds(req.body)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Create report success',
    result
  })
}

export const getReportOfDate = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const date = req.query.date
  const result = await reportAdsServices.GetReportAds(date as string)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Get report success',
    result
  })
}

export const getReportOfRangeDate = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const date = req.body.date as string[]
  const result = await reportAdsServices.GetReportAdsRangeDate(date)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Get report range date success !',
    result
  })
}

export const getRevenueOfYear = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await reportAdsServices.getMonthlyReport()
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Get revenue of year success !',
    result
  })
}

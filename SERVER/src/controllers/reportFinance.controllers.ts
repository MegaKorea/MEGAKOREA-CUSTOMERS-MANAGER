import axios, { HttpStatusCode } from 'axios'
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import reportFinanceServices from '../../services/reportFinance.services'
import dayjs from 'dayjs'

const access_token = process.env.ACCESS_TOKEN_BANK

export const getReport = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { month } = req.params
  const result = await reportFinanceServices.GetReportOfDateServices(month)
  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Create report success',
    result
  })
}

export const getTransaction = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const date = req.params.date
  const previousDate = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD')
  const result = await axios.get(
    `https://my.sepay.vn/userapi/transactions/list?transaction_date_min=${previousDate} 23:00:00&transaction_date_max=${date} 23:00:00`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Get transaction success',
    result: result.data.transactions
  })
}

export const getTransactionAfterId = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const firstId = '8063380'
  const result = await axios.get(`https://my.sepay.vn/userapi/transactions/list?since_id=${firstId}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })

  res.status(HttpStatusCode.Ok).json({
    success: true,
    message: 'Get transaction success',
    result: result.data.transactions
  })
}

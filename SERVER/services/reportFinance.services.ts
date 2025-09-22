import { ReportFinanceAdsType } from '~/models/schemas/ReportAds.schema'
import databaseService from './database.services'

class ReportFinanceServices {
  async CreateReportFinance(body: ReportFinanceAdsType) {
    const { date, balanceEndDay, spend } = body
    const isExsitReport = await databaseService.report_finance.findOne({ date })
    if (isExsitReport) {
      await databaseService.report_finance.updateOne(
        {
          date
        },
        {
          $set: {
            balanceEndDay,
            spend
          }
        }
      )
    } else {
      await databaseService.report_finance.insertOne(body)
    }
  }

  GetReportOfDateServices = (month: string) => {
    return databaseService.report_finance.find({ date: { $regex: month } }).toArray()
  }
}

const reportFinanceServices = new ReportFinanceServices()
export default reportFinanceServices

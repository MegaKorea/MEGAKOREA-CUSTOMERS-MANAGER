import { ObjectId } from 'mongodb'

export interface ReportFinanceAdsType {
  date: string
  balanceEndDay: number
  spend: number
  blaancePreviousDay?: number
}

export default class ReportAds {
  _id?: ObjectId
  date: string
  balanceEndDay: number
  spend: number
  blaancePreviousDay?: number

  constructor(reportAds: ReportFinanceAdsType) {
    this.date = reportAds.date
    this.balanceEndDay = reportAds.balanceEndDay
    this.spend = reportAds.spend
    this.blaancePreviousDay = reportAds.blaancePreviousDay
  }
}

import { ObjectId } from 'mongodb'

export interface CustomerRequestBody {
  _id?: ObjectId
  name: string
  phone: string
  source: string
  status_data: string
  social_media?: string
  telesales?: {
    _id: ObjectId
    name: string
  }
  zalo?: string
  adress?: string
  date_of_birth?: string
  date: string
  branch: string
  sex: string
  service: string[]
  service_detail?: string
  ad_id: string
  pancake: string
}

export interface CustomerRequestParams {
  telesale_id: string
}

export interface CustomerUpdateType {
  _id?: ObjectId
  address: string
  social_media: string
  service_detail: string
  schedule: string
  media: string[]
  bill_media: string[]
  status: string
  history: string[]
  history_edit: string[]
}

export interface CustomerAnalyticsOfDayRequestParams {
  date?: string[] | string
}

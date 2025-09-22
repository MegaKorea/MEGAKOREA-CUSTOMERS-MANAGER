import { ObjectId } from 'mongodb'

export interface HistoryCallOfTelesalesType {
  _id?: ObjectId
  history_call: string[]
  telesale_id: ObjectId
  date: string
  created_at?: Date
  updated_at?: Date
}

export default class HistoryCallOfTelesales {
  _id?: ObjectId
  history_call: string[]
  telesale_id: ObjectId
  date: string
  created_at: Date
  updated_at: Date
  constructor(historyCallOfTelesales: HistoryCallOfTelesalesType) {
    this._id = historyCallOfTelesales._id || new ObjectId()
    this.history_call = historyCallOfTelesales.history_call || []
    this.telesale_id = historyCallOfTelesales.telesale_id
    this.date = historyCallOfTelesales.date || ''
    this.created_at = historyCallOfTelesales.created_at || new Date()
    this.updated_at = historyCallOfTelesales.updated_at || new Date()
  }
}

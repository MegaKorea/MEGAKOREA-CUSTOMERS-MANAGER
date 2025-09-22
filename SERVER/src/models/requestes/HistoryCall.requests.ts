import { ObjectId } from 'mongodb'

export interface HistoryCallOfTelesalesRequestBody {
  telesale_id: ObjectId
  date: string
  history_call: string
}

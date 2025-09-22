import { ObjectId } from 'mongodb'

interface CallMinutesOfTelesalesType {
  _id?: ObjectId
  telesale_id: ObjectId
  call_minutes: number
  total_calls: number
  total_call_missed?: number
  service: string
  date: string
  created_at?: Date
  updated_at?: Date
}

export default class CallMinutesOfTelesales {
  _id?: ObjectId
  telesale_id: ObjectId
  call_minutes: number
  total_calls: number
  total_call_missed: number
  date: string
  service: string
  created_at: Date
  updated_at: Date
  constructor(callMinutesOfTelesales: CallMinutesOfTelesalesType) {
    this._id = callMinutesOfTelesales._id || new ObjectId()
    this.telesale_id = callMinutesOfTelesales.telesale_id
    this.call_minutes = callMinutesOfTelesales.call_minutes
    this.date = callMinutesOfTelesales.date || ''
    this.total_call_missed = callMinutesOfTelesales.total_call_missed || 0
    this.total_calls = callMinutesOfTelesales.total_calls || 0
    this.service = callMinutesOfTelesales.service || ''
    this.created_at = callMinutesOfTelesales.created_at || new Date()
    this.updated_at = callMinutesOfTelesales.updated_at || new Date()
  }
}

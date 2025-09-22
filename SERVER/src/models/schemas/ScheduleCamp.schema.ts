import { ObjectId } from 'mongodb'

interface ScheduleCampType {
  _id?: ObjectId
  user_id: ObjectId
  camp_id: string[]
  date_start: string
  date_set?: string
  created_at?: Date
  updated_at?: Date
}

export default class ScheduleCamp {
  _id?: ObjectId
  user_id: ObjectId
  camp_id: string[]
  date_set: string
  date_start: string
  created_at: Date
  updated_at: Date
  constructor(scheduleCamp: ScheduleCampType) {
    this._id = scheduleCamp._id || new ObjectId()
    this.camp_id = scheduleCamp.camp_id || []
    this.user_id = scheduleCamp.user_id
    this.date_start = scheduleCamp.date_start || ''
    this.date_set = scheduleCamp.date_set || ''
    this.created_at = scheduleCamp.created_at || new Date()
    this.updated_at = scheduleCamp.updated_at || new Date()
  }
}

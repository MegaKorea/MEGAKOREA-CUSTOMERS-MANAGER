import { ObjectId } from 'mongodb'

interface RuleCampType {
  _id?: ObjectId
  user_id: ObjectId
  name: string
  camp_paused: string[]
  camp_duplicated: string[]
  atc_id: string
  log: string[]
  service: string
  branch: string
  maxDuplicate: number
  numberDuplicate: number
  isChangeAge: boolean
  isChangePosition: boolean
  spendCpm: number
  cpmlimit: number
  ctrLimit: number
  spendCtrFirst: number
  spendCtr: number
  thresholdMap: {
    [key: string]: number
  }
  created_at: Date
  updated_at: Date
}

export default class RuleCamp {
  _id?: ObjectId
  name: string
  user_id: ObjectId
  camp_paused: string[]
  camp_duplicated: string[]
  atc_id: string
  log: string[]
  spendCpm: number
  cpmlimit: number
  maxDuplicate: number
  numberDuplicate: number
  isChangeAge: boolean
  isChangePosition: boolean
  ctrLimit: number
  branch: string
  service: string
  spendCtrFirst: number
  spendCtr: number
  thresholdMap: {
    [key: string]: number
  }
  created_at: Date
  updated_at: Date

  constructor(scheduleCamp: RuleCampType) {
    this._id = scheduleCamp._id || new ObjectId()
    this.name = scheduleCamp.name || ''
    this.user_id = scheduleCamp.user_id
    this.camp_paused = scheduleCamp.camp_paused || []
    this.camp_duplicated = scheduleCamp.camp_duplicated || []
    this.atc_id = scheduleCamp.atc_id || ''
    this.log = scheduleCamp.log || []
    this.service = scheduleCamp.service || ''
    this.branch = scheduleCamp.branch || ''
    this.maxDuplicate = scheduleCamp.maxDuplicate || 0
    this.numberDuplicate = scheduleCamp.numberDuplicate || 0
    this.isChangeAge = scheduleCamp.isChangeAge || false
    this.isChangePosition = scheduleCamp.isChangePosition || false
    this.ctrLimit = scheduleCamp.ctrLimit || 0
    this.spendCpm = scheduleCamp.spendCpm || 0
    this.cpmlimit = scheduleCamp.cpmlimit || 0
    this.spendCtrFirst = scheduleCamp.spendCtrFirst || 0
    this.spendCtr = scheduleCamp.spendCtr || 0
    this.thresholdMap = scheduleCamp.thresholdMap || {}
    this.created_at = scheduleCamp.created_at || new Date()
    this.updated_at = scheduleCamp.updated_at || new Date()
  }
}

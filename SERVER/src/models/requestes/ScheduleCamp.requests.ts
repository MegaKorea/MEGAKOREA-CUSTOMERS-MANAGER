import { ObjectId } from 'mongodb'

export interface AddRuleToCampRequest {
  _id: ObjectId
  atc_id: string
}

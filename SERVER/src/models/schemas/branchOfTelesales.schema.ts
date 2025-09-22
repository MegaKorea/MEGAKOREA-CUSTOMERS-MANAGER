import { ObjectId } from 'mongodb'

export interface BranchOfTelesales {
  _id: ObjectId
  name: string
  telesale_primary_id?: ObjectId[]
  telesale_secondary_id?: ObjectId[]
}

export default class BranchOfTelesalesInput {
  _id: ObjectId
  name: string
  telesale_primary_id: ObjectId[]
  telesale_secondary_id: ObjectId[]
  constructor(branchOfTelesales: BranchOfTelesalesInput) {
    this._id = new ObjectId()
    this.name = branchOfTelesales.name
    this.telesale_primary_id = branchOfTelesales.telesale_primary_id || []
    this.telesale_secondary_id = branchOfTelesales.telesale_secondary_id || []
  }
}

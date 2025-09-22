import { ObjectId } from 'mongodb'

interface CustomerOfTelesalesType {
  _id?: ObjectId
  telesale_id: ObjectId
  customer_id: ObjectId[]
  date: string
  created_at?: Date
  updated_at?: Date
}

export default class CustomerOfTelesales {
  _id?: ObjectId
  telesale_id: ObjectId
  customer_id: ObjectId[]
  date: string
  created_at: Date
  updated_at: Date
  constructor(customerOfTelesales: CustomerOfTelesalesType) {
    this._id = customerOfTelesales._id || new ObjectId()
    this.telesale_id = customerOfTelesales.telesale_id
    this.customer_id = customerOfTelesales.customer_id
    this.date = customerOfTelesales.date || ''
    this.created_at = customerOfTelesales.created_at || new Date()
    this.updated_at = customerOfTelesales.updated_at || new Date()
  }
}

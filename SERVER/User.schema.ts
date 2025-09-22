import { ObjectId } from 'mongodb'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role?: string
  deleted?: boolean
  branch?: string[]
  atc?: string[]
  status?: string
  created_at?: Date
  updated_at?: Date
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: string
  branch: string[]
  deleted?: boolean
  atc: string[]
  status: string
  created_at: Date
  updated_at: Date
  constructor(user: UserType) {
    this._id = user._id
    this.name = user.name || ''
    this.email = user.email
    this.password = user.password
    this.atc = user.atc || []
    this.branch = user.branch || []
    this.status = user.status || 'ACTIVE'
    this.role = user.role || 'TELESALES'
    this.created_at = user.created_at || new Date()
    this.updated_at = user.updated_at || new Date()
  }
}

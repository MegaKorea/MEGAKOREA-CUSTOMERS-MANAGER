import { ObjectId } from 'mongodb'

interface CustomerType {
  _id?: ObjectId
  parent_id?: string | null
  branch?: string
  date?: string
  source?: string
  name?: string
  zalo?: string
  phone: string
  address?: string
  date_of_birth?: string
  social_media?: string
  sex?: string
  service?: string[]
  service_detail?: string
  pancake?: string
  schedule?: string
  rate?: number
  media?: string[]
  bill_media?: string[]
  note?: string
  telesales?: {
    _id: ObjectId
    name: string
  }
  telesales_second?: {
    _id: ObjectId
    name: string
  }
  telesales_expried?: {
    _id: ObjectId | string
    name: string
  }
  history?: string[]
  history_edit?: string[]
  record?: string[]
  status?: string
  status_expried?: string
  status_data?: string
  register_schedule?: string
  sales?: string
  sales_assistant?: string
  total_amount?: number
  amount_paid?: number
  outstanding_amount?: number
  reason_failure?: string
  reason_failure_auto?: string
  reason_failure_branch_auto?: string
  final_status_branch?: string
  final_status?: string
  final_status_date?: string
  page_general?: boolean
  is_old_phone?: boolean
  date_expired?: string
  ad?: string
  ad_id: string
  conversation?: string
  created_at?: Date
  updated_at?: Date
}

export default class Customer {
  _id?: ObjectId
  parent_id?: string | null
  branch: string
  date: string
  zalo: string
  history: string[]
  history_edit: string[]
  date_of_birth: string
  source: string
  name: string
  phone: string
  record: string[]
  address: string
  rate: number
  social_media: string
  bill_media: string[]
  note: string
  sex: string
  service: string[]
  media?: string[]
  service_detail: string
  pancake: string
  schedule: string
  register_schedule: string
  telesales: {
    _id: ObjectId | string
    name: string
  }
  telesales_second: {
    _id: ObjectId | string
    name: string
  }
  telesales_expried: {
    _id: ObjectId | string
    name: string
  }
  status: string
  status_expried: string
  status_data: string
  sales: string
  sales_assistant: string
  total_amount: number
  amount_paid: number
  outstanding_amount: number
  reason_failure: string
  reason_failure_auto?: string
  reason_failure_branch_auto?: string
  final_status_branch: string
  final_status: string
  final_status_date: string
  page_general: boolean
  is_old_phone: boolean
  date_expired?: string
  ad?: string
  ad_id: string
  conversation?: string
  created_at: Date
  updated_at: Date
  constructor(customer: CustomerType) {
    this._id = new ObjectId(customer._id)
    this.parent_id = customer.parent_id ? customer.parent_id : null
    this.branch = customer.branch || ''
    this.date = customer.date || ''
    this.source = customer.source || ''
    this.zalo = customer.zalo || ''
    this.history = customer.history || []
    this.history_edit = customer.history_edit || []
    this.date_of_birth = customer.date_of_birth || ''
    this.name = customer.name || ''
    this.phone = customer.phone
    this.address = customer.address || ''
    this.record = customer.record || []
    this.note = customer.note || ''
    this.social_media = customer.social_media || ''
    this.register_schedule = customer.register_schedule || ''
    this.sex = customer.sex || ''
    this.service = customer.service || []
    this.service_detail = customer.service_detail || ''
    this.pancake = customer.pancake || ''
    this.rate = customer.rate || 0
    this.status_data = customer.status_data || ''
    this.schedule = customer.schedule || ''
    this.media = customer.media || []
    this.bill_media = customer.bill_media || []
    this.telesales = customer.telesales || { _id: '', name: '' }
    this.telesales_second = customer.telesales_second || { _id: '', name: '' }
    this.telesales_expried = customer.telesales_expried || { _id: '', name: '' }
    this.sales = customer.sales || ''
    this.sales_assistant = customer.sales_assistant || ''
    this.total_amount = customer.total_amount || 0
    this.amount_paid = customer.amount_paid || 0
    this.outstanding_amount = customer.outstanding_amount || 0
    this.reason_failure = customer.reason_failure || ''
    this.reason_failure_auto = customer.reason_failure_auto || ''
    this.reason_failure_branch_auto = customer.reason_failure_branch_auto || ''
    this.final_status_branch = customer.final_status_branch || ''
    this.final_status = customer.final_status || 'Chưa đến'
    this.final_status_date = customer.final_status_date || ''
    this.status = customer.status || 'Chưa tiếp cận'
    this.status_expried = customer.status_expried || ''
    this.page_general = customer.page_general || false
    this.ad = customer.ad || ''
    this.ad_id = customer.ad_id || ''
    this.conversation = customer.conversation || ''
    this.is_old_phone = customer.is_old_phone || false
    this.date_expired = customer.date_expired || ''
    this.created_at = customer.created_at ? new Date(customer.created_at) : new Date()
    this.updated_at = customer.updated_at || new Date()
  }
}

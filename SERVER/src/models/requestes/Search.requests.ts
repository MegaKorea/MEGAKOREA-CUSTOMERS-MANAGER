export interface SearchCustomersByPhoneRequest {
  phone: string
}

export interface SearchCustomersFillterRequest {
  branch?: string[]
  date?: string
  service?: string[]
  status?: string
  source?: string
  telesale_id?: string
  date_schedule?: string
  pancake?: string
  final_status_date?: string
  final_status_branch?: string
}

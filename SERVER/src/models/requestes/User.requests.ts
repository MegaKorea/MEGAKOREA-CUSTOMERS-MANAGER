import exp from 'constants'
import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enum'

export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  exp: number
  iat: number
  role?: string
}

export interface LoginRequestBody {
  email: string
  password: string
}

export interface AddCustomerToTelesaleRequestBody {
  telesale_id: string
  customer_id: string[]
  date: string
}

export interface UpdateStatusRequestBody {
  status: string
}

export interface UpdateBranchRequestBody {
  branch: string[]
  user_id: string
}

export interface UpdateAtcRequestBody {
  atc: string[]
  user_id: string
}

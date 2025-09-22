import User from '../User.schema'
import { TokenPayload } from './utils/jwt'
import { Request } from 'express'
declare module 'express' {
  interface Request {
    user?: User
    decode_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    telesale?: User
  }
}

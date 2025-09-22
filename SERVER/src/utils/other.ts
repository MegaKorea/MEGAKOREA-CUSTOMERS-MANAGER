import { HttpStatusCode } from '~/constants/enum'
import { userMessages } from '~/constants/messages'
import { ErrorWithStatusCode } from '~/models/Errors'
import { verifyToken } from './jwt'
import { capitalize } from 'lodash'
import { JsonWebTokenError } from 'jsonwebtoken'
import { Request } from 'express'
import _ from 'lodash'
import dayjs from 'dayjs'
export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatusCode({
      message: userMessages.ACCESS_TOKEN_REQUIRED,
      statusCode: HttpStatusCode.Unauthorized
    })
  }
  try {
    const decode_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: process.env.ACCESS_TOKEN_SECRET as string
    })
    if (req) {
      ;(req as Request).decode_authorization = decode_authorization
      return true
    }

    return req ? true : decode_authorization
  } catch (error) {
    throw new ErrorWithStatusCode({
      message: capitalize((error as JsonWebTokenError).message),
      statusCode: HttpStatusCode.Unauthorized
    })
  }
}

export function getContentTypeByExtension(ext: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.dwg': 'application/acad'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

export const convertMinutes = (seconds: number) => {
  return Math.floor(seconds / 60)
}

export const getRandomAgeMin = () => {
  return _.random(27, 32)
}

export const getRandomRadius = (radius: number) => {
  return _.random(radius - 2, radius + 2)
}

export const getRandomAgeMax = () => {
  return _.random(50, 57)
}

export const isIn23h00To23h59PreviousDay = (inputDateTime: string, selectDate: string) => {
  const refDateObj = new Date(`${selectDate}T00:00:00Z`)
  const prevDateObj = new Date(refDateObj)
  prevDateObj.setDate(prevDateObj.getDate() - 1)
  const startTime = new Date(prevDateObj)
  startTime.setHours(23, 0, 0, 0)
  const endTime = new Date(prevDateObj)
  endTime.setHours(23, 59, 59, 999)
  const inputDateObj = new Date(inputDateTime)
  return inputDateObj >= startTime && inputDateObj <= endTime
}

export const isLessThanTenMinutes = (date: Date) => {
  const inputDate = dayjs(date)
  const now = dayjs()
  const diffInMinutes = now.diff(inputDate, 'minute')
  return diffInMinutes <= 10
}

export const timeArrayYesterDay = [
  '09:00:00 - 09:59:59',
  '10:00:00 - 10:59:59',
  '11:00:00 - 11:59:59',
  '12:00:00 - 12:59:59',
  '13:00:00 - 13:59:59',
  '14:00:00 - 14:59:59',
  '15:00:00 - 15:59:59',
  '16:00:00 - 16:59:59',
  '17:00:00 - 17:59:59',
  '18:00:00 - 18:59:59',
  '19:00:00 - 19:59:59',
  '20:00:00 - 20:59:59',
  '21:00:00 - 21:59:59',
  '22:00:00 - 22:59:59',
  '23:00:00 - 23:59:59'
]

export const timeArrayToday = [
  '00:00:00 - 00:59:59',
  '01:00:00 - 01:59:59',
  '02:00:00 - 02:59:59',
  '03:00:00 - 03:59:59',
  '04:00:00 - 04:59:59',
  '05:00:00 - 05:59:59',
  '06:00:00 - 06:59:59',
  '07:00:00 - 07:59:59',
  '08:00:00 - 08:59:59'
]

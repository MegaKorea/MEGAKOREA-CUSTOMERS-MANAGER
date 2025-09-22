import { RegisterRequestBody } from '~/models/requestes/User.requests'
import databaseService from '../services/database.services'
import User from '../User.schema'
import { hashPassword } from '~/utils/crypro'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import { BranchOfTelesales } from '~/models/schemas/branchOfTelesales.schema'

class UsersService {
  private signAccessToken(user_id: string, role?: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, role },
      priveKey: process.env.ACCESS_TOKEN_SECRET as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN, algorithm: 'HS256' }
    })
  }

  private signRefreshToken(user_id: string, role?: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, role },
      priveKey: process.env.REFRESH_TOKEN_SECRET as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN, algorithm: 'HS256' }
    })
  }

  async register(payload: RegisterRequestBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        password: hashPassword(payload.password)
      })
    )

    const user_id = result.insertedId.toHexString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])

    return { access_token, refresh_token }
  }

  async checkEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login(user_id: string, role: string) {
    const [access_token, refresh_token, user] = await Promise.all([
      this.signAccessToken(user_id, role),
      this.signRefreshToken(user_id, role),
      databaseService.users.findOne(
        { _id: new ObjectId(user_id) },
        {
          projection: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            created_at: 0,
            updated_at: 0
          }
        }
      )
    ])
    return { access_token, refresh_token, user }
  }
  async getAllTelesales() {
    return databaseService.users
      .find({ role: 'TELESALE', deleted: { $ne: true } })
      .project({ password: 0, forgot_password_token: 0 })
      .toArray()
  }

  async getAllFbAds() {
    return databaseService.users.find({ role: 'FB-ADS' }).project({ password: 0, forgot_password_token: 0 }).toArray()
  }

  async getAllPancake() {
    return databaseService.users
      .find({ role: { $in: ['PANCAKE', 'ADMIN_PANCAKE'] } })
      .project({ password: 0, forgot_password_token: 0 })
      .toArray()
  }

  async updateStatusUser(user_id: string, status: string) {
    return databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: { status } })
  }

  async updateBranchUser(user_id: string, branch: string[]) {
    return databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: { branch } })
  }

  async updateAtcUser(user_id: string, atc: string[]) {
    return databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: { atc } })
  }

  async addCustomerToTelesale({
    telesale_id,
    customer_id,
    date
  }: {
    telesale_id: string
    customer_id: string[]
    date: string
  }) {
    const telesaleObjectId = new ObjectId(telesale_id)
    const telesale = await databaseService.users.findOne({ _id: telesaleObjectId, role: 'TELESALE' })
    const [result] = await Promise.all([
      databaseService.customers_of_telesales.updateMany(
        {
          telesale_id: telesaleObjectId,
          date
        },
        {
          $addToSet: {
            customer_id: { $each: customer_id.map((id) => new ObjectId(id)) }
          }
        }
      ),
      databaseService.customers.updateMany(
        { _id: { $in: customer_id.map((id) => new ObjectId(id)) } },
        { $set: { telesales: { _id: telesaleObjectId, name: telesale?.name || '' } } }
      )
    ])

    if (result.matchedCount === 0) {
      await Promise.all([
        databaseService.customers_of_telesales.insertOne({
          telesale_id: telesaleObjectId,
          customer_id: customer_id.map((id) => new ObjectId(id)),
          date,
          created_at: new Date(),
          updated_at: new Date()
        }),
        databaseService.customers.updateMany(
          { _id: { $in: customer_id.map((id) => new ObjectId(id)) } },
          { $set: { telesales: { _id: telesaleObjectId, name: telesale?.name || '' } } }
        )
      ])
    }
  }

  async deleteUser(telesale_id: string) {
    return await databaseService.users.deleteOne({ _id: new ObjectId(telesale_id) })
  }

  async getMinutesTelesaleToday(date: string) {
    let match: any
    let dateArr: string[] = []
    let dateCondition: any

    // Xử lý trường hợp khoảng ngày hoặc ngày đơn lẻ
    if (date?.includes('*')) {
      dateArr = (date as string).split('*')
      match = {
        date: {
          $gte: dateArr[0],
          $lte: dateArr[1]
        },
        deleted: { $ne: true }
      }

      dateCondition = {
        $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
      }
    } else {
      match = {
        date: date,
        deleted: { $ne: true }
      }

      dateCondition = { $eq: ['$date', date] }
    }

    return await databaseService.call_minutes_of_telesales
      .aggregate([
        {
          $match: match
        },
        {
          $lookup: {
            from: 'users',
            localField: 'telesale_id',
            foreignField: '_id',
            as: 'telesale'
          }
        },
        {
          $lookup: {
            from: 'history_call_of_telesales',
            let: {
              telesaleId: '$telesale_id'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$telesale_id', '$$telesaleId'] },
                      dateCondition // Sử dụng điều kiện ngày đã xác định trước
                    ]
                  }
                }
              }
            ],
            as: 'history'
          }
        },
        {
          $addFields: {
            history: {
              $reduce: {
                input: '$history',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this.history_call'] }
              }
            }
          }
        },
        {
          $addFields: {
            telesale: {
              $arrayElemAt: ['$telesale', 0]
            }
          }
        },
        {
          $group: {
            _id: '$telesale_id',
            telesale: {
              $first: '$telesale'
            },
            total_calls: {
              $sum: '$total_calls'
            },
            total_call_minutes: {
              $sum: '$call_minutes'
            },
            total_call_missed: {
              $sum: '$total_call_missed'
            },
            history: {
              $first: '$history'
            }
          }
        },
        {
          $project: {
            _id: 1,
            total_calls: 1,
            total_call_minutes: 1,
            total_call_missed: 1,
            history: 1,
            telesale: {
              _id: '$telesale._id',
              name: '$telesale.name',
              status: '$telesale.status'
            }
          }
        }
      ])
      .toArray()
  }

  async getMinutesTelesaleExpiredToday(date: string) {
    let match: any
    let dateArr: string[] = []
    let dateCondition: any

    if (date?.includes('*')) {
      dateArr = (date as string).split('*')
      match = {
        date: {
          $gte: dateArr[0],
          $lte: dateArr[1]
        },
        deleted: { $ne: true }
      }

      dateCondition = {
        $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
      }
    } else {
      match = {
        date: date,
        deleted: { $ne: true }
      }

      dateCondition = { $eq: ['$date', date] }
    }

    return await databaseService.call_minutes_of_telesales_expired
      .aggregate([
        {
          $match: match
        },
        {
          $lookup: {
            from: 'users',
            localField: 'telesale_id',
            foreignField: '_id',
            as: 'telesale'
          }
        },
        {
          $lookup: {
            from: 'history_call_of_telesales',
            let: {
              telesaleId: '$telesale_id'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$telesale_id', '$$telesaleId'] },
                      dateCondition // Sử dụng điều kiện ngày đã xác định trước
                    ]
                  }
                }
              }
            ],
            as: 'history'
          }
        },
        {
          $addFields: {
            history: {
              $reduce: {
                input: '$history',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this.history_call'] }
              }
            }
          }
        },
        {
          $addFields: {
            telesale: {
              $arrayElemAt: ['$telesale', 0]
            }
          }
        },
        {
          $group: {
            _id: '$telesale_id',
            telesale: {
              $first: '$telesale'
            },
            total_calls: {
              $sum: '$total_calls'
            },
            total_call_minutes: {
              $sum: '$call_minutes'
            },
            total_call_missed: {
              $sum: '$total_call_missed'
            },
            history: {
              $first: '$history'
            }
          }
        },
        {
          $project: {
            _id: 1,
            total_calls: 1,
            total_call_minutes: 1,
            total_call_missed: 1,
            history: 1,
            telesale: {
              _id: '$telesale._id',
              name: '$telesale.name',
              status: '$telesale.status'
            }
          }
        }
      ])
      .toArray()
  }

  async getMinutesTelesaleOfMonth(month: string) {
    return await databaseService.call_minutes_of_telesales
      .aggregate([
        {
          $match: {
            date: {
              $regex: `^${month}`
            },
            deleted: { $ne: true }
          }
        }
      ])
      .toArray()
  }

  async getMe(user_id: string) {
    return await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  }

  async getBranchOfTelesales() {
    return await databaseService.branch_of_telesales.find().toArray()
  }

  async updateBranchOfTelesales(id: string, data: Partial<BranchOfTelesales>) {
    return await databaseService.branch_of_telesales.updateOne({ _id: new ObjectId(id) }, { $set: data })
  }
}

const usersService = new UsersService()
export default usersService

import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { SearchCustomersFillterRequest } from '~/models/requestes/Search.requests'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
class SearchServices {
  async searchByPhone(phone: string) {
    return await databaseService.customers
      .aggregate(
        [
          {
            $match: {
              phone: { $regex: phone, $options: 'i' }
            }
          },
          {
            $sort: { create_at: -1 } // Đưa sort vào pipeline
          },
          {
            $limit: 100 // Giới hạn số lượng kết quả trả về
          }
        ],
        { allowDiskUse: true }
      ) // Bật allowDiskUse
      .toArray()
  }

  async searchCustomersOfTelesaleByPhone(phone: string, user_id: string) {
    return await databaseService.customers_of_telesales
      .aggregate([
        {
          $match: {
            telesale_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $unwind: '$customer'
        },
        {
          $match: {
            'customer.phone': {
              $regex: phone
            }
          }
        },
        {
          $replaceRoot: { newRoot: '$customer' }
        }
      ])
      .sort({ create_at: -1 })
      .limit(100) // Giới hạn số lượng kết quả trả về
      .toArray()
  }

  async searchByFilter(filter: SearchCustomersFillterRequest) {
    const matchConditions: any = {}
    if (filter.branch) {
      matchConditions.branch = filter.branch
    }
    if (filter.service) {
      matchConditions.service = filter.service
    }
    if (filter.status) {
      matchConditions.status = filter.status
    }
    if (filter.date) {
      matchConditions.date = filter.date
    }
    return await databaseService.customers
      .aggregate([
        {
          $match: matchConditions
        }
      ])
      .sort({ create_at: -1 })
      .limit(100)
      .toArray()
  }

  async searchCustomersExpriedByPhone(phone: string) {
    const matchConditionsDate: any = {}
    const nowLocal = dayjs()
    const fiveThirtyLocal = dayjs().hour(17).minute(30).second(0).millisecond(0)

    if (nowLocal.isBefore(fiveThirtyLocal)) {
      matchConditionsDate['date'] = { $ne: new Date().toISOString().slice(0, 10) }
    } else {
      matchConditionsDate['$or'] = [
        { created_at: { $ne: new Date().toISOString().slice(0, 10) } },
        {
          created_at: { $eq: new Date().toISOString().slice(0, 10) },
          'userDetails.status': 'offline'
        }
      ]
    }

    const pipeline: any[] = [
      {
        $match: {
          status: { $in: ['Rất quan tâm', 'Vẫn quan tâm', 'Ít quan tâm', 'Chưa tiếp cận', 'Đã đặt chưa đến'] },
          register_schedule: '',
          phone: { $regex: phone, $options: 'i' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'telesales._id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          created_at: {
            $cond: {
              if: { $eq: [{ $type: '$created_at' }, 'date'] },
              then: { $toString: '$created_at' },
              else: '$created_at'
            }
          }
        }
      },
      {
        $match: matchConditionsDate
      }
    ]

    return await databaseService.customers.aggregate(pipeline).sort({ created_at: -1 }).limit(100).toArray()
  }

  async searchCustomersExpriedOfTelesaleByPhone({ phone, user_id }: { phone: string; user_id: string }) {
    const matchConditionsDate: any = {}
    const nowLocal = dayjs()
    const fiveThirtyLocal = dayjs().hour(17).minute(30).second(0).millisecond(0)

    if (nowLocal.isBefore(fiveThirtyLocal)) {
      matchConditionsDate['date'] = { $ne: new Date().toISOString().slice(0, 10) }
    } else {
      matchConditionsDate['$or'] = [
        { created_at: { $ne: new Date().toISOString().slice(0, 10) } },
        {
          created_at: { $eq: new Date().toISOString().slice(0, 10) },
          'userDetails.status': 'offline'
        }
      ]
    }

    const pipeline: any[] = [
      {
        $match: {
          status: { $in: ['Rất quan tâm', 'Ít quan tâm', 'Vẫn quan tâm', 'Chưa tiếp cận', 'Đã đặt chưa đến'] },
          register_schedule: '',
          phone: { $regex: phone, $options: 'i' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'telesales._id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          created_at: {
            $cond: {
              if: { $eq: [{ $type: '$created_at' }, 'date'] },
              then: { $toString: '$created_at' },
              else: '$created_at'
            }
          }
        }
      },
      {
        $match: {
          'telesales_expried._id': user_id,
          ...matchConditionsDate
        }
      }
    ]

    return await databaseService.customers.aggregate(pipeline).sort({ created_at: -1 }).limit(100).toArray()
  }

  async searchCustomersScheduleSuccessBranchByPhone({ phone, role }: { phone: string; role: string }) {
    const branch = role.split('_')[1]
    const result = await databaseService.customers
      .aggregate([
        {
          $match: {
            phone: { $regex: phone, $options: 'i' },
            branch,
            status: {
              $in: ['Thành công', 'Đã đặt chưa đến', 'Đã bào']
            }
          }
        },
        {
          $sort: { created_at: -1 }
        }
      ])
      .toArray()
    return result
  }

  async searchCustomersScheduleSuccessBranch({ phone, role }: { phone: string; role: string }) {
    // const branch = role.split('_')[1]
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            phone: { $regex: phone, $options: 'i' },
            // branch,
            status: {
              $in: ['Thành công', 'Đã đặt chưa đến', 'Đã bào']
            }
          }
        }
      ])
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()
  }
}

const searchServices = new SearchServices()
export default searchServices

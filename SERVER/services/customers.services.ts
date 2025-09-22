import { CustomerRequestBody, CustomerUpdateType } from '../src/models/requestes/Customer.requests'
import databaseService from '../services/database.services'
import Customer from '../src/models/schemas/Customers.schema'
import { ObjectId } from 'mongodb'
import { SearchCustomersFillterRequest } from '~/models/requestes/Search.requests'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

class CustomerServie {
  async addCustomer(payload: CustomerRequestBody) {
    const is_exist_phone = await databaseService.customers.findOne({ phone: payload.phone })
    const result = await databaseService.customers.insertOne(
      new Customer({
        ...payload,
        is_old_phone: is_exist_phone ? true : false
      })
    )
    return result
  }

  async getAllCustomers({
    page,
    limit,
    filter
  }: {
    page: number
    limit: number
    filter: SearchCustomersFillterRequest
  }) {
    const matchConditions: any = {}
    if (filter.branch) {
      matchConditions.branch = {
        $in: filter.branch
      }
    }
    if (filter.service) {
      matchConditions.service = {
        $in: filter.service
      }
    }
    if (filter.status) {
      matchConditions.status = filter.status
    }
    if (filter.date) {
      matchConditions.date = filter.date
    }
    if (filter.date_schedule) {
      matchConditions.schedule = { $regex: `^${filter.date_schedule}` }
    }

    if (filter.telesale_id) {
      matchConditions['telesales._id'] = new ObjectId(filter.telesale_id)
    }

    if (filter.pancake) {
      matchConditions.pancake = filter.pancake
    }

    if (filter.source) {
      matchConditions.source = filter.source
    }

    const [result, total] = await Promise.all([
      databaseService.customers
        .aggregate(
          [
            {
              $match: matchConditions
            },
            {
              $sort: { created_at: -1 }
            },
            {
              $skip: (page - 1) * limit
            },
            {
              $limit: limit
            },
            {
              $project: {
                reason_failure_auto: 0,
                reason_failure_branch_auto: 0,
                telesales_expried: 0,
                status_expried: 0,
                page_general: 0
              }
            }
          ],
          { allowDiskUse: true }
        )
        .toArray(),
      databaseService.customers.countDocuments(matchConditions)
    ])
    return { result, total }
  }

  async getAllCustomersOfTelesale({
    telesale_id,
    page,
    limit,
    filter
  }: {
    telesale_id: string
    page: number
    limit: number
    filter: SearchCustomersFillterRequest
  }) {
    const matchConditions: any = {}
    if (filter.branch) {
      matchConditions['customer.branch'] = {
        $in: filter.branch
      }
    }
    if (filter.service) {
      matchConditions['customer.service'] = {
        $in: filter.service
      }
    }
    if (filter.status) {
      matchConditions['customer.status'] = filter.status
    }
    if (filter.date) {
      matchConditions['customer.date'] = filter.date
    }
    if (filter.date_schedule) {
      matchConditions['customer.schedule'] = { $regex: `^${filter.date_schedule}` }
    }

    if (filter?.telesale_id) {
      matchConditions['telesales._id'] = new ObjectId(filter.telesale_id)
    }
    const [result] = await Promise.all([
      databaseService.customers_of_telesales
        .aggregate(
          [
            {
              $match: {
                telesale_id: new ObjectId(telesale_id)
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
              $match: matchConditions
            },
            {
              $facet: {
                customers: [
                  {
                    $sort: { 'customer.created_at': -1 }
                  },
                  {
                    $skip: (page - 1) * limit
                  },
                  {
                    $limit: limit
                  },
                  {
                    $group: {
                      _id: null,
                      customers: {
                        $push: '$customer'
                      }
                    }
                  }
                ],
                totalCount: [
                  {
                    $count: 'count'
                  }
                ]
              }
            },
            {
              $project: {
                reason_failure_auto: 0,
                reason_failure_branch_auto: 0,
                telesales_expried: 0,
                status_expried: 0,
                page_general: 0
              }
            }
          ],
          { allowDiskUse: true }
        )
        .toArray()
    ])

    const customers = result[0].customers.length > 0 ? result[0].customers[0].customers : []
    const totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0

    return { result: customers, total: totalCount }
  }

  async getAllCustomersExpriedOfTelesale({
    telesale_id,
    page,
    limit,
    filter
  }: {
    telesale_id: string
    page: number
    limit: number
    filter: SearchCustomersFillterRequest
  }) {
    const matchConditions: any = {}
    const matchConditionsDate: any = {}
    matchConditions['telesales_expried._id'] = telesale_id
    if (filter?.branch) {
      matchConditions['branch'] = {
        $in: filter.branch
      }
    }
    if (filter?.service) {
      matchConditions['service'] = {
        $in: filter.service
      }
    }
    if (filter?.status) {
      matchConditions['status'] = filter.status
    }
    if (filter?.date) {
      matchConditions['date'] = filter.date
    }

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
          ...matchConditions
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
      },
      {
        $facet: {
          customers: [
            {
              $sort: { created_at: -1 }
            },
            ...(limit && page
              ? [
                  {
                    $skip: (page - 1) * limit
                  },
                  {
                    $limit: limit
                  }
                ]
              : []),
            {
              $group: {
                _id: null,
                customers: { $push: '$$ROOT' }
              }
            }
          ],
          totalCount: [
            {
              $count: 'count'
            }
          ]
        }
      },
      {
        $project: {
          reason_failure_auto: 0,
          reason_failure_branch_auto: 0,
          telesales_expried: 0,
          status_expried: 0,
          page_general: 0
        }
      }
    ]

    const [result] = await databaseService.customers.aggregate(pipeline).toArray()

    const customers = result.customers.length > 0 ? result.customers[0].customers : []
    const totalCount = result.totalCount.length > 0 ? result.totalCount[0].count : 0

    return { customers: customers, total: totalCount, limit: limit, page: page }
  }

  async updateCustomer(payload: CustomerUpdateType) {
    const { _id, history, history_edit, media, bill_media, ...body } = payload
    const updateOperations: any = {
      $set: {
        ...body,
        outstanding_amount: 0
      }
    }
    if (history) {
      updateOperations.$push = { ...updateOperations.$push, history: { $each: history } }
    }

    if (media) {
      updateOperations.$push = { ...updateOperations.$push, media: { $each: media } }
    }

    if (bill_media) {
      updateOperations.$push = { ...updateOperations.$push, bill_media: { $each: bill_media } }
    }

    if (history_edit) {
      updateOperations.$push = { ...updateOperations.$push, history_edit: { $each: history_edit } }
    }

    const result = await databaseService.customers.updateOne({ _id: new ObjectId(_id) }, updateOperations)

    return result
  }

  async transitonCustomer({
    customer_id,
    telesale_id_old,
    telesale_id_new,
    date
  }: {
    customer_id: string[]
    telesale_id_old: string
    telesale_id_new: string
    date: string
  }) {
    const customer_ids = customer_id.map((id) => new ObjectId(id))
    const telesale_id_old_object = new ObjectId(telesale_id_old)
    const telesale_id_new_object = new ObjectId(telesale_id_new)
    const removeResult = await databaseService.customers_of_telesales.updateMany(
      {
        telesale_id: telesale_id_old_object,
        date
      },
      {
        $pull: {
          customer_id: { $in: customer_ids } as any
        }
      }
    )

    if (removeResult.modifiedCount > 0) {
      const addResult = await databaseService.customers_of_telesales.updateMany(
        {
          telesale_id: telesale_id_new_object,
          date
        },
        {
          $addToSet: {
            customer_id: { $each: customer_ids }
          },
          $set: {
            updated_at: new Date()
          }
        },
        { upsert: true }
      )
      if (addResult.upsertedCount > 0 || addResult.modifiedCount > 0) {
        const telesale = await databaseService.users.findOne({ _id: telesale_id_new_object, role: 'TELESALE' })
        await databaseService.customers.updateMany(
          { _id: { $in: customer_ids } },
          { $set: { telesales: { _id: telesale_id_new_object, name: telesale?.name || '' } } }
        )
      }
    }
  }

  async getAllCustomersExpired({
    limit,
    page,
    filter
  }: {
    limit?: number
    page?: number
    filter?: SearchCustomersFillterRequest
  }) {
    const matchConditions: any = {}
    const matchConditionsDate: any = {}

    if (filter?.branch) {
      matchConditions['branch'] = {
        $in: filter.branch
      }
    }
    if (filter?.service) {
      matchConditions['service'] = {
        $in: filter.service
      }
    }
    if (filter?.status) {
      matchConditions['status'] = filter.status
    }
    if (filter?.date) {
      matchConditions['date'] = filter.date
    }

    if (filter?.telesale_id) {
      matchConditions['telesales._id'] = new ObjectId(filter.telesale_id)
    }

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
          final_status: { $ne: 'Đã đến' },
          register_schedule: '',
          ...matchConditions
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
      },
      {
        $project: {
          reason_failure_auto: 0,
          reason_failure_branch_auto: 0,
          telesales_expried: 0,
          status_expried: 0,
          page_general: 0
        }
      },
      {
        $facet: {
          customers: [
            {
              $sort: { created_at: -1 }
            },
            ...(limit && page
              ? [
                  {
                    $skip: (page - 1) * limit
                  },
                  {
                    $limit: limit
                  }
                ]
              : []),
            {
              $group: {
                _id: null,
                customers: { $push: '$$ROOT' }
              }
            }
          ],
          totalCount: [
            {
              $count: 'count'
            }
          ]
        }
      }
    ]

    const [result] = await databaseService.customers.aggregate(pipeline, { allowDiskUse: true }).toArray()

    const customers = result.customers.length > 0 ? result.customers[0].customers : []
    const totalCount = result.totalCount.length > 0 ? result.totalCount[0].count : 0

    return { customers: customers, total: totalCount, limit: limit, page: page }
  }

  async getAllCustomersExpiredOfTelesale({
    limit,
    page,
    filter
  }: {
    limit?: number
    page?: number
    filter?: SearchCustomersFillterRequest
  }) {
    const matchConditions: any = {}
    const matchConditionsDate: any = {}

    if (filter?.branch) {
      matchConditions['branch'] = {
        $in: filter.branch
      }
    }
    if (filter?.service) {
      matchConditions['service'] = {
        $in: filter.service
      }
    }
    if (filter?.status) {
      matchConditions['status'] = filter.status
    }
    if (filter?.date) {
      matchConditions['date'] = filter.date
    }

    if (filter?.telesale_id) {
      matchConditions['telesales._id'] = new ObjectId(filter.telesale_id)
    }

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
          final_status: { $ne: 'Đã đến' },
          ...matchConditions
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
      },
      {
        $facet: {
          customers: [
            {
              $sort: { created_at: -1 }
            },
            ...(limit && page
              ? [
                  {
                    $skip: (page - 1) * limit
                  },
                  {
                    $limit: limit
                  }
                ]
              : []),
            {
              $group: {
                _id: null,
                customers: { $push: '$$ROOT' }
              }
            }
          ],
          totalCount: [
            {
              $count: 'count'
            }
          ]
        }
      }
    ]

    const [result] = await databaseService.customers.aggregate(pipeline).toArray()

    const customers = result.customers.length > 0 ? result.customers[0].customers : []
    const totalCount = result.totalCount.length > 0 ? result.totalCount[0].count : 0

    return { customers: customers, total: totalCount, limit: limit, page: page }
  }

  async updateRegisterScheduleCustomer() {
    const today = new Date().toISOString().split('T')[0]
    const result = await databaseService.customers
      .find({
        $or: [{ register_schedule: { $lt: today } }]
      })
      .toArray()

    const customer_ids = result.map((customer: any) => customer._id)
    await databaseService.customers.updateMany(
      {
        _id: { $in: customer_ids }
      },
      {
        $set: {
          register_schedule: ''
        }
      }
    )
  }

  async updateCustomersCanceled() {
    const today = new Date().toISOString().split('T')[0]
    const result = await databaseService.customers
      .find({
        $expr: {
          $and: [
            { $in: ['$status', ['Thành công', 'Đã bào']] },
            { $lt: [{ $substr: ['$schedule', 0, 10] }, today] },
            { $eq: ['$final_status', 'Chưa đến'] }
          ]
        }
      })
      .toArray()

    const customer_ids = result.map((customer: any) => customer._id)
    await databaseService.customers.updateMany(
      {
        _id: { $in: customer_ids }
      },
      {
        $set: {
          status: 'Đã đặt chưa đến'
        }
      }
    )
  }

  async getAllRegisterSchedule(user_id: string) {
    return databaseService.customers
      .find({
        'telesales._id': new ObjectId(user_id),
        register_schedule: { $ne: '' }
      })
      .sort({ created_at: -1 })
      .toArray()
  }

  async getAllPancake() {
    return databaseService.customers.find().sort({ created_at: -1 }).toArray()
  }

  async getAllCustomersNoPagination() {
    return await databaseService.customers.find().sort({ created_at: -1 }).toArray()
  }

  async getAllanalyticsCustomerOfDay(date?: string) {
    let dateArr: string[] = []
    let match: any = {}
    let matchFacet: any
    if (date?.includes('*')) {
      dateArr = (date as string).split('*')
      match = {
        $or: [
          {
            date: {
              $gte: dateArr[0],
              $lte: dateArr[1]
            }
          },
          {
            final_status_date: {
              $gte: dateArr[0],
              $lte: dateArr[1]
            }
          }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      matchFacet = { $gte: dateArr[0], $lte: dateArr[1] }
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      matchFacet = date
    }

    return await databaseService.customers
      .aggregate([
        {
          $match: match
        },
        {
          $facet: {
            customers_not_contacted: [
              {
                $match: {
                  status: 'Chưa tiếp cận',
                  date: matchFacet
                }
              },
              {
                $count: 'count'
              }
            ],
            customer_arrive: [
              {
                $match: {
                  final_status: 'Đã đến',
                  final_status_date: matchFacet
                }
              },
              {
                $count: 'count'
              }
            ],
            customer_success: [
              {
                $match: {
                  status: { $in: ['Thành công'] },
                  date: matchFacet
                }
              },
              {
                $count: 'count'
              }
            ],
            total_customers: [
              {
                $match: {
                  date: matchFacet,
                  source: 'Facebook'
                }
              },
              {
                $count: 'count'
              }
            ]
          }
        },
        {
          $project: {
            customers_not_contacted: {
              $ifNull: [{ $arrayElemAt: ['$customers_not_contacted.count', 0] }, 0]
            },
            customer_arrive: {
              $ifNull: [{ $arrayElemAt: ['$customer_arrive.count', 0] }, 0]
            },
            customer_success: {
              $ifNull: [{ $arrayElemAt: ['$customer_success.count', 0] }, 0]
            },
            total_customers: {
              $ifNull: [{ $arrayElemAt: ['$total_customers.count', 0] }, 0]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllanalyticsCustomerBranchOfDay(date?: string, branch?: string) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          {
            date: { $gte: dateArr[0], $lte: dateArr[1] }
          },
          {
            final_status_date: { $gte: dateArr[0], $lte: dateArr[1] }
          }
        ],
        parent_id: null,
        branch: branch,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = { $gte: dateArr[0], $lte: dateArr[1] }
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        branch: branch,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        { $match: match },
        {
          $facet: {
            customers_not_contacted: [
              {
                $match: {
                  status: 'Chưa tiếp cận',
                  $or: [
                    Array.isArray(dateFacet)
                      ? {
                          date: {
                            $gte: dateArr[0],
                            $lte: dateArr[1]
                          }
                        }
                      : { date: dateFacet }
                  ]
                }
              },
              { $count: 'count' }
            ],
            customer_arrive: [
              {
                $match: {
                  final_status: 'Đã đến',
                  $or: [
                    Array.isArray(dateFacet)
                      ? {
                          final_status_date: {
                            $gte: dateArr[0],
                            $lte: dateArr[1]
                          }
                        }
                      : { final_status_date: dateFacet }
                  ]
                }
              },
              { $count: 'count' }
            ],
            customer_success: [
              {
                $match: {
                  status: { $in: ['Thành công'] },
                  $or: [
                    Array.isArray(dateFacet)
                      ? {
                          date: {
                            $gte: dateArr[0],
                            $lte: dateArr[1]
                          }
                        }
                      : { date: dateFacet }
                  ]
                }
              },
              { $count: 'count' }
            ],
            total_customers: [
              {
                $match: {
                  branch: branch,
                  $or: [
                    Array.isArray(dateFacet)
                      ? {
                          $and: [
                            {
                              date: {
                                $gte: dateArr[0],
                                $lte: dateArr[1]
                              },
                              source: 'Facebook'
                            }
                          ]
                        }
                      : {
                          $and: [{ date: dateFacet, source: 'Facebook' }]
                        }
                  ]
                }
              },
              { $count: 'count' }
            ]
          }
        },
        {
          $project: {
            customers_not_contacted: {
              $ifNull: [{ $arrayElemAt: ['$customers_not_contacted.count', 0] }, 0]
            },
            customer_arrive: {
              $ifNull: [{ $arrayElemAt: ['$customer_arrive.count', 0] }, 0]
            },
            customer_success: {
              $ifNull: [{ $arrayElemAt: ['$customer_success.count', 0] }, 0]
            },
            total_customers: {
              $ifNull: [{ $arrayElemAt: ['$total_customers.count', 0] }, 0]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersDetailsOfDay(date?: string) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          {
            date: { $gte: dateArr[0], $lte: dateArr[1] }
          },
          {
            final_status_date: { $gte: dateArr[0], $lte: dateArr[1] }
          }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        { $match: match },
        {
          // Bước 1: Tạo document mới với cấu trúc rõ ràng
          $addFields: {
            // Tính toán cho telesales chính
            primary_telesales_name: '$telesales.name',

            // Chỉ tính customers_success cho telesales chính khi không có telesales_second
            primary_count_success: {
              $cond: [
                // Kiểm tra có telesales_second hay không
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0, // Nếu có telesales_second, không tính cho telesales chính
                {
                  $cond: [
                    {
                      $and: [
                        { $in: ['$status', ['Thành công', 'Đã bào']] },
                        // Kiểm tra date theo dateFacet
                        Array.isArray(dateFacet)
                          ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                          : { $eq: ['$date', dateFacet] }
                      ]
                    },
                    1, // Điều kiện đúng, tính 1
                    0 // Điều kiện sai, tính 0
                  ]
                }
              ]
            },

            // Tương tự cho customer_arrive
            primary_count_arrive: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$final_status', 'Đã đến'] },
                        Array.isArray(dateFacet)
                          ? {
                              $and: [
                                { $gte: ['$final_status_date', dateArr[0]] },
                                { $lte: ['$final_status_date', dateArr[1]] }
                              ]
                            }
                          : { $eq: ['$final_status_date', dateFacet] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },

            // Luôn tính total_customers và not_contacted cho telesales chính
            primary_count_total: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$source', 'Facebook'] },
                    Array.isArray(dateFacet)
                      ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                      : { $eq: ['$date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },
            primary_count_not_contacted: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Chưa tiếp cận'] },
                    Array.isArray(dateFacet)
                      ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                      : { $eq: ['$date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },

            // Tính toán cho telesales phụ
            secondary_telesales_name: '$telesales_second.name',

            // Tính đầy đủ customers_success cho telesales phụ
            secondary_count_success: {
              $cond: [
                {
                  $and: [
                    // Chỉ tính khi có telesales_second
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $in: ['$status', ['Thành công', 'Đã bào']] },
                    Array.isArray(dateFacet)
                      ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                      : { $eq: ['$date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },

            // Tương tự cho customer_arrive
            secondary_count_arrive: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    Array.isArray(dateFacet)
                      ? {
                          $and: [
                            { $gte: ['$final_status_date', dateArr[0]] },
                            { $lte: ['$final_status_date', dateArr[1]] }
                          ]
                        }
                      : { $eq: ['$final_status_date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },

            // Giá trị cố định cho telesales phụ
            secondary_count_total: 0,
            secondary_count_not_contacted: 0
          }
        },

        // Bước 2: Tạo hai luồng xử lý riêng biệt
        {
          $facet: {
            // Xử lý cho telesales chính
            primary: [
              // Lọc chỉ lấy bản ghi có telesales chính
              { $match: { primary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales chính
                $group: {
                  _id: '$primary_telesales_name',
                  total_customers: { $sum: '$primary_count_total' },
                  customers_success: { $sum: '$primary_count_success' },
                  customers_not_contacted: { $sum: '$primary_count_not_contacted' },
                  customer_arrive: { $sum: '$primary_count_arrive' }
                }
              }
            ],

            // Xử lý cho telesales phụ
            secondary: [
              // Lọc chỉ lấy bản ghi có telesales phụ
              { $match: { secondary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales phụ
                $group: {
                  _id: '$secondary_telesales_name',
                  total_customers: { $sum: '$secondary_count_total' }, // Luôn = 0
                  customers_success: { $sum: '$secondary_count_success' },
                  customers_not_contacted: { $sum: '$secondary_count_not_contacted' }, // Luôn = 0
                  customer_arrive: { $sum: '$secondary_count_arrive' }
                }
              }
            ]
          }
        },

        // Bước 3: Gộp kết quả từ cả hai nhóm
        {
          $project: {
            all_telesales: {
              $concatArrays: ['$primary', '$secondary']
            }
          }
        },

        // Bước 4: Tách từng telesales ra để xử lý
        { $unwind: '$all_telesales' },

        // Bước 5: Nhóm lại theo tên telesales để gộp các kết quả
        {
          $group: {
            _id: '$all_telesales._id',
            total_customers: { $sum: '$all_telesales.total_customers' },
            customers_success: { $sum: '$all_telesales.customers_success' },
            customers_not_contacted: { $sum: '$all_telesales.customers_not_contacted' },
            customer_arrive: { $sum: '$all_telesales.customer_arrive' }
          }
        },

        // Bước 6: Tính toán các tỷ lệ phần trăm cuối cùng
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersExpriedDetailsOfDay(date?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            parent_id: null,
            source: { $nin: ['Số trùng'] },
            date_expried: date
          }
        },
        {
          $match: {
            'telesales_expried.name': { $nin: ['', null] }
          }
        },
        {
          $group: {
            _id: '$telesales_expried.name',
            total_customers: { $sum: 1 },
            customers_success: {
              $sum: {
                $cond: [{ $in: ['$status_expried', ['Thành công', 'Đã bào']] }, 1, 0]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [{ $eq: ['$final_status', 'Đã đến'] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsTotalBranchDetailsOfDay(date?: string) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          {
            date: { $gte: dateArr[0], $lte: dateArr[1] }
          },
          {
            final_status_date: { $gte: dateArr[0], $lte: dateArr[1] }
          }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: '$branch',
            total_customers: {
              $sum: {
                $cond: [
                  Array.isArray(dateFacet)
                    ? {
                        $and: [
                          { $gte: ['$date', dateArr[0]] },
                          { $lte: ['$date', dateArr[1]] },
                          { $eq: ['$source', 'Facebook'] }
                        ]
                      }
                    : {
                        $and: [{ $eq: ['$date', dateFacet] }, { $eq: ['$source', 'Facebook'] }]
                      },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : {
                            $eq: ['$date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : { $eq: ['$date', dateFacet] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [
                              { $gte: ['$final_status_date', dateArr[0]] },
                              { $lte: ['$final_status_date', dateArr[1]] }
                            ]
                          }
                        : {
                            $eq: ['$final_status_date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_success', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_not_contacted', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customer_arrive', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersPancakeDetailsOfDay(date?: string) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          {
            date: { $gte: dateArr[0], $lte: dateArr[1] }
          },
          {
            final_status_date: { $gte: dateArr[0], $lte: dateArr[1] }
          }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        pancake: {
          $not: {
            $regex: '^Telesale'
          }
        }
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        pancake: {
          $not: {
            $regex: '^Telesale'
          }
        }
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: '$pancake',
            total_customers: {
              $sum: {
                $cond: [
                  Array.isArray(dateFacet)
                    ? {
                        $and: [
                          { $gte: ['$date', dateArr[0]] },
                          { $lte: ['$date', dateArr[1]] },
                          { $eq: ['$source', 'Facebook'] }
                        ]
                      }
                    : {
                        $and: [{ $eq: ['$date', dateFacet] }, { $eq: ['$source', 'Facebook'] }]
                      },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : {
                            $eq: ['$date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : { $eq: ['$date', dateFacet] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [
                              { $gte: ['$final_status_date', dateArr[0]] },
                              { $lte: ['$final_status_date', dateArr[1]] }
                            ]
                          }
                        : {
                            $eq: ['$final_status_date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersDetailsOfMonth(date?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            parent_id: null,
            source: { $nin: ['Số trùng'] }
          }
        },
        {
          $addFields: {
            // Telesales chính
            primary_telesales_name: '$telesales.name',

            // Nếu có telesales_second, không tính success và arrive cho telesales chính
            primary_count_success: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $in: ['$status', ['Thành công', 'Đã bào']] },
                        { $regexMatch: { input: '$date', regex: `^${date}` } }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },
            primary_count_arrive: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$final_status', 'Đã đến'] },
                        { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },

            // Luôn tính total_customers và not_contacted cho telesales chính
            primary_count_total: {
              $cond: [
                { $and: [{ $regexMatch: { input: '$date', regex: `^${date}` } }, { $eq: ['$source', 'Facebook'] }] },
                1,
                0
              ]
            },
            primary_count_not_contacted: {
              $cond: [
                {
                  $and: [{ $eq: ['$status', 'Chưa tiếp cận'] }, { $regexMatch: { input: '$date', regex: `^${date}` } }]
                },
                1,
                0
              ]
            },

            // Telesales phụ
            secondary_telesales_name: '$telesales_second.name',

            // Tính đầy đủ customers_success cho telesales phụ
            secondary_count_success: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $in: ['$status', ['Thành công', 'Đã bào']] },
                    { $regexMatch: { input: '$date', regex: `^${date}` } }
                  ]
                },
                1,
                0
              ]
            },
            secondary_count_arrive: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                  ]
                },
                1,
                0
              ]
            },

            // Không tính total_customers và not_contacted cho telesales phụ
            secondary_count_total: 0,
            secondary_count_not_contacted: 0
          }
        },

        // Tạo hai nhóm riêng biệt cho telesales chính và phụ
        {
          $facet: {
            // Xử lý cho telesales chính
            primary: [
              // Lọc chỉ lấy bản ghi có telesales chính
              { $match: { primary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales chính
                $group: {
                  _id: '$primary_telesales_name',
                  total_customers: { $sum: '$primary_count_total' },
                  customers_success: { $sum: '$primary_count_success' },
                  customers_not_contacted: { $sum: '$primary_count_not_contacted' },
                  customer_arrive: { $sum: '$primary_count_arrive' }
                }
              }
            ],

            // Xử lý cho telesales phụ
            secondary: [
              // Lọc chỉ lấy bản ghi có telesales phụ
              { $match: { secondary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales phụ
                $group: {
                  _id: '$secondary_telesales_name',
                  total_customers: { $sum: '$secondary_count_total' }, // Luôn = 0
                  customers_success: { $sum: '$secondary_count_success' },
                  customers_not_contacted: { $sum: '$secondary_count_not_contacted' }, // Luôn = 0
                  customer_arrive: { $sum: '$secondary_count_arrive' }
                }
              }
            ]
          }
        },

        // Gộp kết quả
        {
          $project: {
            all_telesales: { $concatArrays: ['$primary', '$secondary'] }
          }
        },
        { $unwind: '$all_telesales' },
        {
          $group: {
            _id: '$all_telesales._id',
            total_customers: { $sum: '$all_telesales.total_customers' },
            customers_success: { $sum: '$all_telesales.customers_success' },
            customers_not_contacted: { $sum: '$all_telesales.customers_not_contacted' },
            customer_arrive: { $sum: '$all_telesales.customer_arrive' }
          }
        },
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersDetailsSpecialServicesOfMonthS(date?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            parent_id: null,
            source: { $nin: ['Số trùng'] }
          }
        },
        {
          $addFields: {
            primary_telesales_name: '$telesales.name',
            primary_customer_arrive: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] },
                    { $eq: [{ $ifNull: ['$telesales_second.name', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            },
            primary_totalServicesLoseWeight: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $in: ['Giảm béo', '$service'] },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] },
                    { $eq: [{ $ifNull: ['$telesales_second.name', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            },
            primary_totalServicesWrinkleRemovalandHair: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $or: [{ $in: ['Tóc', '$service'] }, { $in: ['Xóa nhăn', '$service'] }] },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] },
                    { $eq: [{ $ifNull: ['$telesales_second.name', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            },
            primary_totalServicesOther: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    {
                      $not: {
                        $or: [
                          { $in: ['Tóc', '$service'] },
                          { $in: ['Xóa nhăn', '$service'] },
                          { $in: ['Giảm béo', '$service'] }
                        ]
                      }
                    },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] },
                    { $eq: [{ $ifNull: ['$telesales_second.name', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            },
            primary_totalServicesTrial: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $eq: ['$final_status_branch', 'Trải nghiệm 0 đồng'] },
                    { $eq: [{ $ifNull: ['$telesales_second.name', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            },

            secondary_telesales_name: '$telesales_second.name',

            secondary_customer_arrive: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] }
                  ]
                },
                1,
                0
              ]
            },
            secondary_totalServicesLoseWeight: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $in: ['Giảm béo', '$service'] },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] }
                  ]
                },
                1,
                0
              ]
            },
            secondary_totalServicesWrinkleRemovalandHair: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $or: [{ $in: ['Tóc', '$service'] }, { $in: ['Xóa nhăn', '$service'] }] },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] }
                  ]
                },
                1,
                0
              ]
            },
            secondary_totalServicesOther: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    // Đã sửa: Sử dụng $not và $or để loại trừ cả 3 loại dịch vụ
                    {
                      $not: {
                        $or: [
                          { $in: ['Tóc', '$service'] },
                          { $in: ['Xóa nhăn', '$service'] },
                          { $in: ['Giảm béo', '$service'] }
                        ]
                      }
                    },
                    { $ne: ['$final_status_branch', 'Trải nghiệm 0 đồng'] }
                  ]
                },
                1,
                0
              ]
            },
            secondary_totalServicesTrial: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
                    { $eq: ['$final_status_branch', 'Trải nghiệm 0 đồng'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        },
        // Tạo hai nhóm riêng biệt cho telesales chính và phụ
        {
          $facet: {
            // Xử lý cho telesales chính
            primary: [
              // Lọc chỉ lấy bản ghi có telesales chính
              { $match: { primary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales chính
                $group: {
                  _id: '$primary_telesales_name',
                  customer_arrive: { $sum: '$primary_customer_arrive' },
                  totalServicesLoseWeight: { $sum: '$primary_totalServicesLoseWeight' },
                  totalServicesWrinkleRemovalandHair: { $sum: '$primary_totalServicesWrinkleRemovalandHair' },
                  totalServicesOther: { $sum: '$primary_totalServicesOther' },
                  totalServicesTrial: { $sum: '$primary_totalServicesTrial' }
                }
              }
            ],

            // Xử lý cho telesales phụ
            secondary: [
              // Lọc chỉ lấy bản ghi có telesales phụ
              { $match: { secondary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales phụ
                $group: {
                  _id: '$secondary_telesales_name',
                  customer_arrive: { $sum: '$secondary_customer_arrive' },
                  totalServicesLoseWeight: { $sum: '$secondary_totalServicesLoseWeight' },
                  totalServicesWrinkleRemovalandHair: { $sum: '$secondary_totalServicesWrinkleRemovalandHair' },
                  totalServicesOther: { $sum: '$secondary_totalServicesOther' },
                  totalServicesTrial: { $sum: '$secondary_totalServicesTrial' }
                }
              }
            ]
          }
        },
        // Gộp kết quả
        {
          $project: {
            all_telesales: { $concatArrays: ['$primary', '$secondary'] }
          }
        },
        { $unwind: '$all_telesales' },
        {
          $group: {
            _id: '$all_telesales._id',
            customer_arrive: { $sum: '$all_telesales.customer_arrive' },
            totalServicesLoseWeight: { $sum: '$all_telesales.totalServicesLoseWeight' },
            totalServicesWrinkleRemovalandHair: { $sum: '$all_telesales.totalServicesWrinkleRemovalandHair' },
            totalServicesOther: { $sum: '$all_telesales.totalServicesOther' },
            totalServicesTrial: { $sum: '$all_telesales.totalServicesTrial' }
          }
        },
        {
          $project: {
            telesales: '$_id',
            customer_arrive: 1,
            totalServicesLoseWeight: 1,
            totalServicesWrinkleRemovalandHair: 1,
            totalServicesOther: 1,
            totalServicesTrial: 1
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersPancakeDetailsOfMonth(date?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            parent_id: null,
            source: { $nin: ['Số trùng'] },
            pancake: {
              $not: {
                $regex: '^Telesale'
              }
            }
          }
        },
        {
          $group: {
            _id: '$pancake',
            total_customers: {
              $sum: {
                $cond: [
                  { $and: [{ $regexMatch: { input: '$date', regex: `^${date}` } }, { $eq: ['$source', 'Facebook'] }] },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      { $regexMatch: { input: '$date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      { $regexMatch: { input: '$date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_success', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_not_contacted', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customer_arrive', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsTotalBranchDetailsOfMonth(date?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            parent_id: null,
            source: { $nin: ['Số trùng'] }
          }
        },
        {
          $group: {
            _id: '$branch',
            total_customers: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $regexMatch: { input: '$date', regex: `^${date}` } }, { $eq: ['$source', 'Facebook'] }]
                  },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      { $regexMatch: { input: '$date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      { $regexMatch: { input: '$date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_success', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_not_contacted', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customer_arrive', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  //vip
  // async getAllAnalyticsCustomersByServiceOfMonth(date?: string) {
  //   return await databaseService.customers
  //     .aggregate([
  //       {
  //         $match: {
  //           $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
  //           parent_id: null,
  //           source: { $nin: ['Số trùng'] }
  //         }
  //       },
  //       {
  //         $unwind: '$service'
  //       },
  //       // Tạo 2 records: 1 cho telesales (total_customers) và 1 cho telesales_second (customers_arrived)
  //       {
  //         $facet: {
  //           // Pipeline cho telesales (đếm total_customers)
  //           telesales_data: [
  //             {
  //               $group: {
  //                 _id: {
  //                   telesale: '$telesales.status',
  //                   telesale_name: '$telesales.name',
  //                   telesale_id: '$telesales._id',
  //                   service: '$service'
  //                 },
  //                 total_customers: {
  //                   $sum: {
  //                     $cond: [
  //                       {
  //                         $and: [
  //                           { $regexMatch: { input: '$date', regex: `^${date}` } },
  //                           { $eq: ['$source', 'Facebook'] }
  //                         ]
  //                       },
  //                       1,
  //                       0
  //                     ]
  //                   }
  //                 },
  //                 // Chỉ đếm customers_arrived cho telesales khi không có telesales_second
  //                 customers_arrived: {
  //                   $sum: {
  //                     $cond: [
  //                       {
  //                         $and: [
  //                           { $eq: ['$final_status', 'Đã đến'] },
  //                           { $regexMatch: { input: '$final_status_date', regex: `^${date}` } },
  //                           {
  //                             $or: [
  //                               { $eq: ['$telesales_second.name', ''] },
  //                               { $eq: ['$telesales_second.name', null] },
  //                               { $not: { $ifNull: ['$telesales_second.name', false] } }
  //                             ]
  //                           }
  //                         ]
  //                       },
  //                       1,
  //                       0
  //                     ]
  //                   }
  //                 }
  //               }
  //             },
  //             {
  //               $project: {
  //                 telesale: '$_id.telesale',
  //                 telesale_name: '$_id.telesale_name',
  //                 telesale_id: '$_id.telesale_id',
  //                 service: '$_id.service',
  //                 total_customers: 1,
  //                 customers_arrived: 1
  //               }
  //             }
  //           ],
  //           // Pipeline cho telesales_second (đếm customers_arrived)
  //           telesales_second_data: [
  //             {
  //               $match: {
  //                 $and: [{ 'telesales_second.name': { $exists: true, $ne: '' } }]
  //               }
  //             },
  //             {
  //               $group: {
  //                 _id: {
  //                   telesale: '$telesales_second.status',
  //                   telesale_name: '$telesales_second.name',
  //                   telesale_id: '$telesales_second._id',
  //                   service: '$service'
  //                 },
  //                 total_customers: { $sum: 0 }, // Luôn = 0 cho telesales_second
  //                 customers_arrived: {
  //                   $sum: {
  //                     $cond: [
  //                       {
  //                         $and: [
  //                           { $eq: ['$final_status', 'Đã đến'] },
  //                           { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
  //                         ]
  //                       },
  //                       1,
  //                       0
  //                     ]
  //                   }
  //                 }
  //               }
  //             },
  //             {
  //               $project: {
  //                 telesale: '$_id.telesale',
  //                 telesale_name: '$_id.telesale_name',
  //                 telesale_id: '$_id.telesale_id',
  //                 service: '$_id.service',
  //                 total_customers: 1,
  //                 customers_arrived: 1
  //               }
  //             }
  //           ]
  //         }
  //       },
  //       // Kết hợp kết quả từ cả 2 pipeline
  //       {
  //         $project: {
  //           combined: {
  //             $concatArrays: ['$telesales_data', '$telesales_second_data']
  //           }
  //         }
  //       },
  //       {
  //         $unwind: '$combined'
  //       },
  //       {
  //         $replaceRoot: { newRoot: '$combined' }
  //       },
  //       // Group lại để merge data của cùng 1 telesale + service
  //       {
  //         $group: {
  //           _id: {
  //             telesale_name: '$telesale_name',
  //             telesale_id: '$telesale_id',
  //             service: '$service'
  //           },
  //           telesale: { $first: '$telesale' },
  //           total_customers: { $sum: '$total_customers' },
  //           customers_arrived: { $sum: '$customers_arrived' }
  //         }
  //       },
  //       {
  //         $project: {
  //           telesale: 1,
  //           telesale_name: '$_id.telesale_name',
  //           service: '$_id.service',
  //           total_customers: 1,
  //           customers_arrived: 1,
  //           arrival_rate: {
  //             $cond: {
  //               if: { $eq: ['$total_customers', 0] },
  //               then: 0,
  //               else: {
  //                 $multiply: [{ $divide: ['$customers_arrived', '$total_customers'] }, 100]
  //               }
  //             }
  //           }
  //         }
  //       },
  //       {
  //         $sort: {
  //           telesale_name: 1,
  //           service: 1
  //         }
  //       }
  //     ])
  //     .toArray()
  // }

  async getAllAnalyticsCustomersByServiceOfMonth(date?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            parent_id: null,
            source: { $nin: ['Số trùng'] }
          }
        },
        {
          $unwind: '$service'
        },
        {
          $addFields: {
            // Telesales chính
            primary_telesales_name: '$telesales.name',
            primary_telesales_status: '$telesales.status',

            // Nếu có telesales_second, không tính total_customers cho telesales chính
            primary_count_total: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [{ $regexMatch: { input: '$date', regex: `^${date}` } }, { $eq: ['$source', 'Facebook'] }]
                    },
                    1,
                    0
                  ]
                }
              ]
            },
            primary_count_arrived: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$final_status', 'Đã đến'] },
                        { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },

            // Telesales phụ
            secondary_telesales_name: '$telesales_second.name',
            secondary_telesales_status: '$telesales_second.status',

            // Không tính total_customers cho telesales phụ, chỉ tính customers_arrived
            secondary_count_total: 0,
            secondary_count_arrived: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                  ]
                },
                1,
                0
              ]
            }
          }
        },

        // Tạo hai nhóm riêng biệt cho telesales chính và phụ
        {
          $facet: {
            // Xử lý cho telesales chính
            primary: [
              // Lọc chỉ lấy bản ghi có telesales chính
              { $match: { primary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales chính và service
                $group: {
                  _id: {
                    telesale: '$primary_telesales_status',
                    telesale_name: '$primary_telesales_name',
                    service: '$service'
                  },
                  total_customers: { $sum: '$primary_count_total' },
                  customers_arrived: { $sum: '$primary_count_arrived' }
                }
              }
            ],

            // Xử lý cho telesales phụ
            secondary: [
              // Lọc chỉ lấy bản ghi có telesales phụ
              { $match: { secondary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales phụ và service
                $group: {
                  _id: {
                    telesale: '$secondary_telesales_status',
                    telesale_name: '$secondary_telesales_name',
                    service: '$service'
                  },
                  total_customers: { $sum: '$secondary_count_total' }, // Luôn = 0
                  customers_arrived: { $sum: '$secondary_count_arrived' }
                }
              }
            ]
          }
        },

        // Gộp kết quả
        {
          $project: {
            all_telesales: { $concatArrays: ['$primary', '$secondary'] }
          }
        },
        { $unwind: '$all_telesales' },

        // Group lại để tổng hợp kết quả cho từng telesales + service
        {
          $group: {
            _id: {
              telesale: '$all_telesales._id.telesale',
              telesale_name: '$all_telesales._id.telesale_name',
              service: '$all_telesales._id.service'
            },
            total_customers: { $sum: '$all_telesales.total_customers' },
            customers_arrived: { $sum: '$all_telesales.customers_arrived' }
          }
        },

        {
          $project: {
            telesale: '$_id.telesale',
            telesale_name: '$_id.telesale_name',
            service: '$_id.service',
            total_customers: 1,
            customers_arrived: 1,
            arrival_rate: {
              $cond: {
                if: { $eq: ['$total_customers', 0] },
                then: 0,
                else: {
                  $multiply: [{ $divide: ['$customers_arrived', '$total_customers'] }, 100]
                }
              }
            }
          }
        },
        {
          $sort: {
            telesale: 1,
            service: 1
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsBranchCustomersDetailsOfDay(date?: string, branch?: string) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          { date: { $gte: dateArr[0], $lte: dateArr[1] } },
          { final_status_date: { $gte: dateArr[0], $lte: dateArr[1] } }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        branch: branch
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        branch: branch
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        { $match: match },
        {
          $addFields: {
            // Telesales chính
            primary_telesales_name: '$telesales.name',

            // Nếu có telesales_second, không tính success và arrive cho telesales chính
            primary_count_success: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $in: ['$status', ['Thành công', 'Đã bào']] },
                        Array.isArray(dateFacet)
                          ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                          : { $eq: ['$date', dateFacet] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },
            primary_count_arrive: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$final_status', 'Đã đến'] },
                        Array.isArray(dateFacet)
                          ? {
                              $and: [
                                { $gte: ['$final_status_date', dateArr[0]] },
                                { $lte: ['$final_status_date', dateArr[1]] }
                              ]
                            }
                          : { $eq: ['$final_status_date', dateFacet] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },

            // Luôn tính total_customers và not_contacted cho telesales chính
            primary_count_total: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$source', 'Facebook'] },
                    Array.isArray(dateFacet)
                      ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                      : { $eq: ['$date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },
            primary_count_not_contacted: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Chưa tiếp cận'] },
                    Array.isArray(dateFacet)
                      ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                      : { $eq: ['$date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },

            // Telesales phụ
            secondary_telesales_name: '$telesales_second.name',

            // Các chỉ số cho telesales phụ
            secondary_count_success: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $in: ['$status', ['Thành công', 'Đã bào']] },
                    Array.isArray(dateFacet)
                      ? { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }
                      : { $eq: ['$date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },
            secondary_count_arrive: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    Array.isArray(dateFacet)
                      ? {
                          $and: [
                            { $gte: ['$final_status_date', dateArr[0]] },
                            { $lte: ['$final_status_date', dateArr[1]] }
                          ]
                        }
                      : { $eq: ['$final_status_date', dateFacet] }
                  ]
                },
                1,
                0
              ]
            },

            // Không tính total_customers và not_contacted cho telesales phụ
            secondary_count_total: 0,
            secondary_count_not_contacted: 0
          }
        },

        // Tạo hai nhóm riêng biệt cho telesales chính và phụ
        {
          $facet: {
            // Xử lý cho telesales chính
            primary: [
              // Lọc chỉ lấy bản ghi có telesales chính
              { $match: { primary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales chính
                $group: {
                  _id: '$primary_telesales_name',
                  total_customers: { $sum: '$primary_count_total' },
                  customers_success: { $sum: '$primary_count_success' },
                  customers_not_contacted: { $sum: '$primary_count_not_contacted' },
                  customer_arrive: { $sum: '$primary_count_arrive' }
                }
              }
            ],

            // Xử lý cho telesales phụ
            secondary: [
              // Lọc chỉ lấy bản ghi có telesales phụ
              { $match: { secondary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales phụ
                $group: {
                  _id: '$secondary_telesales_name',
                  total_customers: { $sum: '$secondary_count_total' }, // Luôn = 0
                  customers_success: { $sum: '$secondary_count_success' },
                  customers_not_contacted: { $sum: '$secondary_count_not_contacted' }, // Luôn = 0
                  customer_arrive: { $sum: '$secondary_count_arrive' }
                }
              }
            ]
          }
        },

        // Gộp kết quả
        {
          $project: {
            all_telesales: { $concatArrays: ['$primary', '$secondary'] }
          }
        },
        { $unwind: '$all_telesales' },
        {
          $group: {
            _id: '$all_telesales._id',
            total_customers: { $sum: '$all_telesales.total_customers' },
            customers_success: { $sum: '$all_telesales.customers_success' },
            customers_not_contacted: { $sum: '$all_telesales.customers_not_contacted' },
            customer_arrive: { $sum: '$all_telesales.customer_arrive' }
          }
        },
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersBranchDetailsOfMonth(date?: string, branch?: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            branch: branch,
            parent_id: null,
            source: { $nin: ['Số trùng'] }
          }
        },
        {
          $addFields: {
            // Telesales chính
            primary_telesales_name: '$telesales.name',

            // Nếu có telesales_second, không tính success và arrive cho telesales chính
            primary_count_success: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $in: ['$status', ['Thành công', 'Đã bào']] },
                        { $regexMatch: { input: '$date', regex: `^${date}` } }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },
            primary_count_arrive: {
              $cond: [
                { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                0,
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$final_status', 'Đã đến'] },
                        { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                      ]
                    },
                    1,
                    0
                  ]
                }
              ]
            },

            // Luôn tính total_customers và not_contacted cho telesales chính
            primary_count_total: {
              $cond: [
                { $and: [{ $regexMatch: { input: '$date', regex: `^${date}` } }, { $eq: ['$source', 'Facebook'] }] },
                1,
                0
              ]
            },
            primary_count_not_contacted: {
              $cond: [
                {
                  $and: [{ $eq: ['$status', 'Chưa tiếp cận'] }, { $regexMatch: { input: '$date', regex: `^${date}` } }]
                },
                1,
                0
              ]
            },

            // Telesales phụ
            secondary_telesales_name: '$telesales_second.name',

            // Tính đầy đủ customers_success cho telesales phụ
            secondary_count_success: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $in: ['$status', ['Thành công', 'Đã bào']] },
                    { $regexMatch: { input: '$date', regex: `^${date}` } }
                  ]
                },
                1,
                0
              ]
            },
            secondary_count_arrive: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$telesales_second.name', ''] }, ''] },
                    { $eq: ['$final_status', 'Đã đến'] },
                    { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                  ]
                },
                1,
                0
              ]
            },

            // Không tính total_customers và not_contacted cho telesales phụ
            secondary_count_total: 0,
            secondary_count_not_contacted: 0
          }
        },

        // Tạo hai nhóm riêng biệt cho telesales chính và phụ
        {
          $facet: {
            // Xử lý cho telesales chính
            primary: [
              // Lọc chỉ lấy bản ghi có telesales chính
              { $match: { primary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales chính
                $group: {
                  _id: '$primary_telesales_name',
                  total_customers: { $sum: '$primary_count_total' },
                  customers_success: { $sum: '$primary_count_success' },
                  customers_not_contacted: { $sum: '$primary_count_not_contacted' },
                  customer_arrive: { $sum: '$primary_count_arrive' }
                }
              }
            ],

            // Xử lý cho telesales phụ
            secondary: [
              // Lọc chỉ lấy bản ghi có telesales phụ
              { $match: { secondary_telesales_name: { $nin: ['', null] } } },
              {
                // Nhóm theo tên telesales phụ
                $group: {
                  _id: '$secondary_telesales_name',
                  total_customers: { $sum: '$secondary_count_total' }, // Luôn = 0
                  customers_success: { $sum: '$secondary_count_success' },
                  customers_not_contacted: { $sum: '$secondary_count_not_contacted' }, // Luôn = 0
                  customer_arrive: { $sum: '$secondary_count_arrive' }
                }
              }
            ]
          }
        },

        // Gộp kết quả
        {
          $project: {
            all_telesales: { $concatArrays: ['$primary', '$secondary'] }
          }
        },
        { $unwind: '$all_telesales' },
        {
          $group: {
            _id: '$all_telesales._id',
            total_customers: { $sum: '$all_telesales.total_customers' },
            customers_success: { $sum: '$all_telesales.customers_success' },
            customers_not_contacted: { $sum: '$all_telesales.customers_not_contacted' },
            customer_arrive: { $sum: '$all_telesales.customer_arrive' }
          }
        },
        {
          $project: {
            telesales: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllAnalyticsCustomersBranchByServiceOfMonth(date?: string, branch?: string) {
    // Khai báo các biến cho khoảng ngày
    let dateCondition: any
    let dateArr: string[] = []
    let totalCustomersCondition: any
    let customersArrivedCondition: any

    // Xử lý trường hợp khoảng ngày
    if (date?.includes('*')) {
      dateArr = date.split('*')

      // Điều kiện match cho khoảng ngày - vẫn giữ cả date và final_status_date
      // để lấy tất cả dữ liệu liên quan, nhưng việc tính toán sẽ theo điều kiện cụ thể
      dateCondition = {
        $or: [
          { date: { $gte: dateArr[0], $lte: dateArr[1] } },
          { final_status_date: { $gte: dateArr[0], $lte: dateArr[1] } }
        ],
        branch: branch,
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }

      // Điều kiện cho total_customers - chỉ tính theo date
      totalCustomersCondition = {
        $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }, { $eq: ['$source', 'Facebook'] }]
      }

      // Điều kiện cho customers_arrived
      customersArrivedCondition = {
        $and: [
          { $eq: ['$final_status', 'Đã đến'] },
          { $gte: ['$final_status_date', dateArr[0]] },
          { $lte: ['$final_status_date', dateArr[1]] }
        ]
      }
    } else {
      // Trường hợp ngày đơn
      dateCondition = {
        $or: [{ date: date }, { final_status_date: date }],
        branch: branch,
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }

      // Điều kiện cho total_customers - chỉ tính theo date
      totalCustomersCondition = {
        $and: [{ $eq: ['$date', date] }, { $eq: ['$source', 'Facebook'] }]
      }

      // Điều kiện cho customers_arrived
      customersArrivedCondition = {
        $and: [{ $eq: ['$final_status', 'Đã đến'] }, { $eq: ['$final_status_date', date] }]
      }
    }

    return await databaseService.customers
      .aggregate(
        [
          {
            $match: dateCondition
          },
          {
            $unwind: '$service'
          },
          {
            $group: {
              _id: {
                telesale: '$telesales.status',
                telesale_name: '$telesales.name',
                service: '$service'
              },
              total_customers: {
                $sum: {
                  $cond: [totalCustomersCondition, 1, 0]
                }
              },
              customers_arrived: {
                $sum: {
                  $cond: [customersArrivedCondition, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              telesale: '$_id.telesale',
              telesale_name: '$_id.telesale_name',
              service: '$_id.service',
              total_customers: 1,
              customers_arrived: 1,
              arrival_rate: {
                $cond: {
                  if: { $eq: ['$total_customers', 0] },
                  then: 0,
                  else: {
                    $multiply: [{ $divide: ['$customers_arrived', '$total_customers'] }, 100]
                  }
                }
              }
            }
          },
          {
            $sort: {
              telesale: 1,
              service: 1
            }
          }
        ],
        { allowDiskUse: true }
      )
      .toArray()
  }

  async scheduleSuccess({
    page,
    limit,
    filter,
    role
  }: {
    page: number
    limit: number
    filter: SearchCustomersFillterRequest
    role: string
  }) {
    const branch = role.split('_')[1]
    const matchConditions: any = {
      status: { $in: ['Thành công', 'Đã đặt chưa đến', 'Đã bào'] }
    }
    if (filter.service) {
      matchConditions.service = filter.service
    }

    if (filter)
      if (filter.date) {
        matchConditions.schedule = { $regex: `^${filter.date}` }
      }

    if (filter.final_status_date) {
      matchConditions.final_status_date = filter.final_status_date
    }

    if (filter.final_status_branch) {
      matchConditions.final_status_branch = filter.final_status_branch
    }

    const [result, total] = await Promise.all([
      databaseService.customers
        .aggregate([
          {
            $match: {
              ...matchConditions,
              branch: branch
            }
          },
          {
            $sort: { schedule: -1 }
          },
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.customers.countDocuments({ ...matchConditions, branch: branch })
    ])
    return { result, total }
  }

  async updateRecord({ record, customer_id }: { record: any; customer_id: string }) {
    return await databaseService.customers.updateOne(
      {
        _id: new ObjectId(customer_id)
      },
      {
        $push: {
          record: record
        }
      }
    )
  }

  async scheduleSuccessByTelesales({
    page,
    limit,
    filter
  }: {
    page: number
    limit: number
    filter: SearchCustomersFillterRequest
  }) {
    const matchConditions: any = {
      status: { $in: ['Thành công', 'Đã đặt chưa đến', 'Đã bào'] }
    }
    if (filter.branch) {
      matchConditions.branch = {
        $in: filter.branch
      }
    }
    if (filter.service) {
      matchConditions.service = filter.service
    }
    if (filter.status) {
      matchConditions.status = filter.status
    }
    if (filter.date) {
      matchConditions.schedule = { $regex: `^${filter.date}` }
    }

    if (filter.telesale_id) {
      matchConditions['telesales._id'] = new ObjectId(filter.telesale_id)
    }

    if (filter.final_status_date) {
      matchConditions.final_status_date = filter.final_status_date
    }

    if (filter.final_status_branch) {
      matchConditions.final_status_branch = filter.final_status_branch
    }

    const [result, total] = await Promise.all([
      databaseService.customers
        .aggregate([
          {
            $match: matchConditions
          },
          {
            $sort: { schedule: -1 }
          },
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.customers.countDocuments(matchConditions)
    ])
    return { result, total }
  }

  async deleteCustomer(customer_id: string) {
    return await Promise.all([
      databaseService.customers.deleteOne({ _id: new ObjectId(customer_id) }),
      databaseService.customers_of_telesales.updateOne(
        { customer_id: new ObjectId(customer_id) },
        { $pull: { customer_id: new ObjectId(customer_id) } }
      )
    ])
  }

  async removeCustomerFromTelesale({ customer_id, telesale_id }: { customer_id: string; telesale_id: string }) {
    const [result] = await Promise.all([
      databaseService.customers_of_telesales.updateOne(
        {
          telesale_id: new ObjectId(telesale_id),
          customer_id: { $in: [new ObjectId(customer_id)] }
        },
        {
          $pull: {
            customer_id: new ObjectId(customer_id)
          }
        }
      ),
      databaseService.customers.updateOne(
        {
          _id: new ObjectId(customer_id)
        },
        {
          $set: {
            telesales: { _id: '', name: '' }
          }
        }
      )
    ])
    return result
  }

  async deleteRecord({ customer_id, record }: { customer_id: string; record: string }) {
    return await databaseService.customers.updateOne(
      {
        _id: new ObjectId(customer_id)
      },
      {
        $pull: {
          record: record
        }
      }
    )
  }

  async deleteImageCustomer({ customer_id, media }: { customer_id: string; media: string }) {
    return await databaseService.customers.updateOne(
      {
        _id: new ObjectId(customer_id)
      },
      {
        $pull: {
          media: media
        }
      }
    )
  }

  async deleteImageBill({ customer_id, bill_media }: { customer_id: string; bill_media: string }) {
    return await databaseService.customers.updateOne(
      {
        _id: new ObjectId(customer_id)
      },
      {
        $pull: {
          bill_media: bill_media
        }
      }
    )
  }

  async getAllCustomersWillArriveToday(date: string) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any
    if (date?.includes('*')) {
      dateArr = date.split('*')
      const startDay = parseInt(dateArr[0].slice(8, 10))
      const endDay = parseInt(dateArr[1].slice(8, 10))
      const monthYear = dateArr[0].slice(0, 8)
      const dayRange = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i).join('|')

      match = {
        $or: [
          { date: { $gte: dateArr[0], $lte: dateArr[1] } },
          { schedule: { $regex: new RegExp(`^${monthYear}(${dayRange})`) } },
          { final_status_date: { $gte: dateArr[0], $lte: dateArr[1] } }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [
          { date: date },
          {
            $expr: { $eq: [{ $substr: ['$schedule', 0, 10] }, date] }
          }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = date
    }
    return await databaseService.customers
      .aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: '$branch',
            schedule_today: {
              $sum: {
                $cond: [
                  Array.isArray(dateFacet)
                    ? {
                        $and: [
                          { $gte: [{ $substr: ['$schedule', 0, 10] }, dateFacet[0].slice(0, 10)] },
                          { $lte: [{ $substr: ['$schedule', 0, 10] }, dateFacet[1].slice(0, 10)] }
                        ]
                      }
                    : {
                        $eq: [{ $substr: ['$schedule', 0, 10] }, date]
                      },
                  1,
                  0
                ]
              }
            },
            arrived_count: {
              $sum: { $eq: ['$final_status', 'Đã đến'] }
            },
            total_customers: {
              $sum: {
                $cond: [
                  Array.isArray(dateFacet)
                    ? {
                        $and: [
                          { $gte: ['$date', dateArr[0]] },
                          { $lte: ['$date', dateArr[1]] },
                          { $eq: ['$source', 'Facebook'] }
                        ]
                      }
                    : {
                        $and: [{ $eq: ['$date', dateFacet] }, { $eq: ['$source', 'Facebook'] }]
                      },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : {
                            $eq: ['$date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : { $eq: ['$date', dateFacet] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [
                              { $gte: ['$final_status_date', dateArr[0]] },
                              { $lte: ['$final_status_date', dateArr[1]] }
                            ]
                          }
                        : {
                            $eq: ['$final_status_date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            schedule_today: 1,
            arrived_count: 1,
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async getAllCustomersWillArriveOfBranchToday(date: string, branch: string) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [
              {
                final_status_date: date
              },
              {
                schedule: {
                  $regex: `^${date}`
                }
              }
            ],
            branch: branch
          }
        },
        {
          $group: {
            _id: '$branch',
            schedule_today: {
              $sum: 1
            },
            arrived_count: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $eq: ['$final_status', 'Đã đến'] }, { $eq: ['$final_status_date', date] }]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            schedule_today: 1,
            arrived_count: 1
          }
        }
      ])
      .toArray()
  }

  async removePancakeOfCustomer(customer_id: string) {
    return await databaseService.customers.updateOne(
      {
        _id: new ObjectId(customer_id)
      },
      {
        $set: {
          pancake: ''
        }
      }
    )
  }

  async analyticsCustomerBranchByServiceOfDay({ date, branch }: { date: string; branch: string }) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          { date: { $gte: dateArr[0], $lte: dateArr[1] } },
          { final_status_date: { $gte: dateArr[0], $lte: dateArr[1] } }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        branch: branch
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        branch: branch
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        { $match: match },
        { $unwind: '$service' },
        {
          $group: {
            _id: '$service',
            total_customers: {
              $sum: {
                $cond: [
                  Array.isArray(dateFacet)
                    ? {
                        $and: [
                          { $gte: ['$date', dateArr[0]] },
                          { $lte: ['$date', dateArr[1]] },
                          { $eq: ['$source', 'Facebook'] }
                        ]
                      }
                    : {
                        $and: [{ $eq: ['$date', dateFacet] }, { $eq: ['$source', 'Facebook'] }]
                      },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : {
                            $eq: ['$date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : { $eq: ['$date', dateFacet] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [
                              { $gte: ['$final_status_date', dateArr[0]] },
                              { $lte: ['$final_status_date', dateArr[1]] }
                            ]
                          }
                        : { $eq: ['$final_status_date', dateFacet] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            _id: branch,
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async analyticsCustomerBranchByServiceOfMonth({ date, branch }: { date: string; branch: string }) {
    // Khai báo các biến để xử lý khoảng ngày
    let dateCondition: any
    let dateArr: string[] = []
    let dateMatchCondition: any
    let customersSuccessCondition: any
    let customersNotContactedCondition: any
    let customerArriveCondition: any

    // Xử lý trường hợp khoảng ngày (có dấu *)
    if (date?.includes('*')) {
      dateArr = date.split('*')

      // Điều kiện match cho khoảng ngày
      dateCondition = {
        branch: branch,
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        $or: [
          { date: { $gte: dateArr[0], $lte: dateArr[1] } },
          { final_status_date: { $gte: dateArr[0], $lte: dateArr[1] } }
        ]
      }

      // Điều kiện kiểm tra date trong khoảng ngày (cho total_customers)
      dateMatchCondition = {
        $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
      }

      // Điều kiện cho customers_success
      customersSuccessCondition = {
        $and: [
          { $in: ['$status', ['Thành công', 'Đã bào']] },
          { $gte: ['$date', dateArr[0]] },
          { $lte: ['$date', dateArr[1]] }
        ]
      }

      // Điều kiện cho customers_not_contacted
      customersNotContactedCondition = {
        $and: [{ $eq: ['$status', 'Chưa tiếp cận'] }, { $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
      }

      // Điều kiện cho customer_arrive
      customerArriveCondition = {
        $and: [
          { $eq: ['$final_status', 'Đã đến'] },
          { $gte: ['$final_status_date', dateArr[0]] },
          { $lte: ['$final_status_date', dateArr[1]] }
        ]
      }
    } else {
      // Trường hợp ngày đơn - sử dụng so sánh chính xác
      dateCondition = {
        branch: branch,
        parent_id: null,
        source: { $nin: ['Số trùng'] },
        $or: [{ date: date }, { final_status_date: date }]
      }

      // Điều kiện kiểm tra date chính xác (cho total_customers)
      dateMatchCondition = { $eq: ['$date', date] }

      // Điều kiện cho customers_success
      customersSuccessCondition = {
        $and: [{ $in: ['$status', ['Thành công', 'Đã bào']] }, { $eq: ['$date', date] }]
      }

      // Điều kiện cho customers_not_contacted
      customersNotContactedCondition = {
        $and: [{ $eq: ['$status', 'Chưa tiếp cận'] }, { $eq: ['$date', date] }]
      }

      // Điều kiện cho customer_arrive
      customerArriveCondition = {
        $and: [{ $eq: ['$final_status', 'Đã đến'] }, { $eq: ['$final_status_date', date] }]
      }
    }

    return await databaseService.customers
      .aggregate(
        [
          {
            $match: dateCondition
          },
          {
            $unwind: '$service'
          },
          {
            $group: {
              _id: '$service',
              // Chỉ tính total_customers khi date đúng với điều kiện
              total_customers: {
                $sum: {
                  $cond: [dateMatchCondition, 1, 0]
                }
              },
              customers_success: {
                $sum: {
                  $cond: [customersSuccessCondition, 1, 0]
                }
              },
              customers_not_contacted: {
                $sum: {
                  $cond: [customersNotContactedCondition, 1, 0]
                }
              },
              customer_arrive: {
                $sum: {
                  $cond: [customerArriveCondition, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              branch: '$_id',
              _id: branch,
              total_customers: 1,
              customers_success: 1,
              precents_customer_success: {
                $cond: [
                  { $eq: ['$total_customers', 0] },
                  0,
                  { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
                ]
              },
              customers_not_contacted: 1,
              precent_customer_not_contacted: {
                $cond: [
                  { $eq: ['$total_customers', 0] },
                  0,
                  { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
                ]
              },
              customer_arrive: 1,
              precents_customer_arrive: {
                $cond: [
                  { $eq: ['$total_customers', 0] },
                  0,
                  { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
                ]
              }
            }
          }
        ],
        { allowDiskUse: true }
      ) // Thêm allowDiskUse để tránh lỗi Sort exceeded memory limit
      .toArray()
  }

  async analyticsCustomerBranchTotalByServiceOfDay({ date }: { date: string }) {
    let dateArr: string[] = []
    let match: any = {}
    let dateFacet: any

    if (date?.includes('*')) {
      dateArr = date.split('*')
      match = {
        $or: [
          { date: { $gte: dateArr[0], $lte: dateArr[1] } },
          { final_status_date: { $gte: dateArr[0], $lte: dateArr[1] } }
        ],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = dateArr
    } else {
      match = {
        $or: [{ date: date }, { final_status_date: date }],
        parent_id: null,
        source: { $nin: ['Số trùng'] }
      }
      dateFacet = date
    }

    return await databaseService.customers
      .aggregate([
        { $match: match },
        { $unwind: '$service' },
        {
          $group: {
            _id: '$service',
            total_customers: {
              $sum: {
                $cond: [
                  Array.isArray(dateFacet)
                    ? {
                        $or: [{ $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] }]
                      }
                    : { $eq: ['$date', dateFacet] },
                  1,
                  0
                ]
              }
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : {
                            $eq: ['$date', dateFacet]
                          }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      Array.isArray(dateFacet)
                        ? {
                            $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }]
                          }
                        : { $eq: ['$date', dateFacet] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      Array.isArray(dateFacet)
                        ? {
                            $or: [
                              { $and: [{ $gte: ['$date', dateArr[0]] }, { $lte: ['$date', dateArr[1]] }] },
                              {
                                $and: [
                                  { $gte: ['$final_status_date', dateArr[0]] },
                                  { $lte: ['$final_status_date', dateArr[1]] }
                                ]
                              }
                            ]
                          }
                        : { $or: [{ $eq: ['$date', dateFacet] }, { $eq: ['$final_status_date', dateFacet] }] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_success', '$total_customers'] }, 100] }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customers_not_contacted', '$total_customers'] }, 100] }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                { $eq: ['$total_customers', 0] },
                0,
                { $multiply: [{ $divide: ['$customer_arrive', '$total_customers'] }, 100] }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async analyticsCustomerBranchTotalByServiceOfMonth({ date }: { date: string }) {
    return await databaseService.customers
      .aggregate([
        {
          $match: {
            $or: [{ date: { $regex: `^${date}` } }, { final_status_date: { $regex: `^${date}` } }],
            parent_id: null,
            source: { $nin: ['Số trùng'] }
          }
        },
        {
          $unwind: '$service'
        },
        {
          $group: {
            _id: '$service',
            total_customers: {
              $sum: 1
            },
            customers_success: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Thành công', 'Đã bào']] },
                      { $regexMatch: { input: '$date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customers_not_contacted: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Chưa tiếp cận'] },
                      { $regexMatch: { input: '$date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            customer_arrive: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$final_status', 'Đã đến'] },
                      { $regexMatch: { input: '$final_status_date', regex: `^${date}` } }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            branch: '$_id',
            total_customers: 1,
            customers_success: 1,
            precents_customer_success: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_success', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customers_not_contacted: 1,
            precent_customer_not_contacted: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customers_not_contacted', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            },
            customer_arrive: 1,
            precents_customer_arrive: {
              $cond: [
                {
                  $eq: ['$total_customers', 0]
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: ['$customer_arrive', '$total_customers']
                    },
                    100
                  ]
                }
              ]
            }
          }
        }
      ])
      .toArray()
  }

  async TrackingCustomer(date: string[]) {
    const match = {
      date: {
        $gte: date[0],
        $lte: date[1]
      },
      $and: [
        { ad: { $exists: true } },
        {
          $or: [{ ad: { $type: 'string', $ne: '' } }, { ad: { $type: 'string', $regex: /\S/ } }]
        }
      ]
    }

    const pipeline = [
      { $match: match },
      {
        // Bước 1: Unwind mảng service để xử lý từng service riêng biệt
        $unwind: '$service'
      },
      {
        // Bước 2: Group theo ad và thu thập thông tin
        $group: {
          _id: '$ad',
          totalServices: { $sum: 1 },
          successfulServices: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Thành công'] }, 1, 0]
            }
          },
          branch: { $addToSet: '$branch' },
          allServicesWithStatus: {
            $push: {
              service: '$service',
              status: '$status'
            }
          }
        }
      },
      {
        // Bước 3: Tính tỷ lệ thành công
        $addFields: {
          successRate: {
            $multiply: [{ $divide: ['$successfulServices', '$totalServices'] }, 100]
          }
        }
      },
      {
        // Bước 4: Sắp xếp theo số service thành công giảm dần
        $sort: { successfulServices: -1 }
      },
      {
        // Bước 5: Format kết quả cuối cùng
        $project: {
          adUrl: '$_id',
          totalServices: 1,
          successfulServices: 1,
          successRate: { $round: ['$successRate', 2] },
          successfulServicesList: {
            $map: {
              input: {
                $filter: {
                  input: '$allServicesWithStatus',
                  cond: { $eq: ['$$this.status', 'Thành công'] }
                }
              },
              as: 'item',
              in: '$$item.service'
            }
          },
          branch: 1,
          _id: 0
        }
      }
    ]
    const result = await databaseService.customers.aggregate(pipeline).toArray()
    const adEffectiveness = result.filter((item) => item.successfulServices > 1)
    return adEffectiveness
  }

  async TrackingCustomerContent(ad: string[], dateQuery: string, branch?: string) {
    let dateFilter

    if (dateQuery === 'last_7d') {
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)

      dateFilter = {
        $gte: sevenDaysAgo.toISOString().split('T')[0],
        $lte: today.toISOString().split('T')[0]
      }
    } else if (dateQuery === 'last_30d') {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      dateFilter = {
        $gte: thirtyDaysAgo.toISOString().split('T')[0],
        $lte: today.toISOString().split('T')[0]
      }
    } else if (dateQuery === 'last_14d') {
      const today = new Date()
      const fourteenDaysAgo = new Date(today)
      fourteenDaysAgo.setDate(today.getDate() - 14)

      dateFilter = {
        $gte: fourteenDaysAgo.toISOString().split('T')[0],
        $lte: today.toISOString().split('T')[0]
      }
    }

    const safeRegexPattern = ad.join('|')

    const match = {
      ad: { $regex: safeRegexPattern },
      $or: [{ date: dateFilter }, { final_status_date: dateFilter }]
    }

    if (branch) {
      Object.assign(match, { branch: branch })
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$ad',
          totalCustomers: { $sum: 1 },
          successfulCustomers: {
            $sum: {
              $cond: [{ $in: ['$status', ['Thành công', 'Đã bào']] }, 1, 0]
            }
          },
          revenue: { $sum: '$total_amount' }
        }
      }
    ]
    const result = await databaseService.customers.aggregate(pipeline).toArray()
    return result
  }

  async TrackingAds(ad_id: string, date_preset: string) {
    const createDateFilter = (datePreset: string) => {
      if (datePreset === 'maximum') {
        return undefined
      }
      const today = dayjs()
      let startDate
      switch (datePreset) {
        case 'last_7d':
          startDate = today.subtract(6, 'day')
          break
        case 'last_14d':
          startDate = today.subtract(13, 'day')
          break
        case 'last_30d':
          startDate = today.subtract(29, 'day')
          break
        default:
          throw new Error(`Invalid date_preset: ${datePreset}. Valid values are: last_7d, last_14d, last_30d, maximum`)
      }

      return {
        $gte: startDate.startOf('day').format('YYYY-MM-DD'),
        $lte: today.endOf('day').format('YYYY-MM-DD')
      }
    }

    const [result, customers] = await Promise.all([
      databaseService.customers
        .aggregate([
          {
            $match: {
              ad_id,
              date: createDateFilter(date_preset)
            }
          },
          {
            $group: {
              _id: '$ad',
              revenue: { $sum: '$total_amount' },
              customer: { $addToSet: '$customer_id' }
            }
          }
        ])
        .toArray(),
      databaseService.customers.countDocuments({ ad_id, date: createDateFilter(date_preset) })
    ])
    const total = result.reduce((sum, item) => sum + item.revenue, 0)
    const average = result.length > 0 ? total / result.length : 0

    return {
      total,
      average,
      customers
    }
  }
}

const customerService = new CustomerServie()
export default customerService

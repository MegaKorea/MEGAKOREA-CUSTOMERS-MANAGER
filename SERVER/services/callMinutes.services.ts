import { ObjectId } from 'mongodb'
import databaseService from './database.services'

class CallMinutesOfTelesalesService {
  async addCallMinutesToTelesale({
    telesale_id,
    minutes,
    service,
    date,
    customer_id,
    missed
  }: {
    telesale_id: string
    minutes: number
    service: string
    date: string
    missed: boolean
    customer_id: string
  }) {
    if (!ObjectId.isValid(telesale_id)) {
      return
    }

    const customer = await databaseService.customers.findOne({
      _id: new ObjectId(customer_id)
    })

    const result = await databaseService.call_minutes_of_telesales.updateMany(
      {
        telesale_id: new ObjectId(telesale_id),
        date,
        service
      },
      {
        $inc: {
          call_minutes: minutes,
          total_calls: 1,
          total_call_missed: missed ? 1 : 0
        }
      }
    )

    if (customer && customer.telesales_expried._id !== '') {
      const resultExpired = await databaseService.call_minutes_of_telesales_expired.updateMany(
        {
          telesale_id: new ObjectId(telesale_id),
          date,
          service
        },
        {
          $inc: {
            call_minutes: minutes,
            total_calls: 1,
            total_call_missed: missed ? 1 : 0
          }
        }
      )
      if (resultExpired.matchedCount === 0) {
        await databaseService.call_minutes_of_telesales_expired.insertOne({
          telesale_id: new ObjectId(telesale_id),
          call_minutes: minutes,
          date,
          total_calls: 1,
          service,
          total_call_missed: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
      }
    }

    if (result.matchedCount === 0) {
      await databaseService.call_minutes_of_telesales.insertOne({
        telesale_id: new ObjectId(telesale_id),
        call_minutes: minutes,
        date,
        total_calls: 1,
        service,
        total_call_missed: 0,
        created_at: new Date(),
        updated_at: new Date()
      })
    }
  }
}

const callMinutesOfTelesalesService = new CallMinutesOfTelesalesService()
export default callMinutesOfTelesalesService

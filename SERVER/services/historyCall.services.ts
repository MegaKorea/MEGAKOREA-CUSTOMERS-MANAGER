import HistoryCallOfTelesales from '~/models/schemas/HistoryCallOfTelesales.schema'
import databaseService from './database.services'
import { HistoryCallOfTelesalesRequestBody } from '~/models/requestes/HistoryCall.requests'
import { ObjectId } from 'mongodb'
class histiryCallServices {
  async getHistoryCall() {
    return await databaseService.history_call_of_telesales.aggregate([]).toArray()
  }

  async addHistoryCallOfTelesales(body: HistoryCallOfTelesalesRequestBody) {
    const result = await databaseService.history_call_of_telesales.updateOne(
      {
        telesale_id: new ObjectId(body.telesale_id),
        date: body.date
      },
      {
        $push: {
          history_call: body.history_call
        }
      }
    )
    if (result.matchedCount === 0) {
      await databaseService.history_call_of_telesales.insertOne(
        new HistoryCallOfTelesales({
          ...body,
          history_call: [body.history_call],
          telesale_id: new ObjectId(body.telesale_id)
        })
      )
    }
  }
}

const historyCallServices = new histiryCallServices()

export default historyCallServices

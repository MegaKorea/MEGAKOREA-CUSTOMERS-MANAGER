import databaseService from './database.services'
import ScheduleCamp from '../src/models/schemas/ScheduleCamp.schema'
import RuleCamp from '~/models/schemas/RuleControllerCapm'
import { AddRuleToCampRequest } from '~/models/requestes/ScheduleCamp.requests'
import { ObjectId } from 'mongodb'
import _ from 'lodash'
class ScheduleCampServices {
  async CreateScheduleCampaigns(body: any) {
    const { user_id, date_start, date_set, camp_id } = body
    const isExistSchedule = await databaseService.schedule_ads.findOne({
      user_id: new ObjectId(user_id as string),
      date_start,
      date_set
    })
    if (isExistSchedule) {
      const differenceCamp = _.difference(camp_id, isExistSchedule?.camp_id || [])
      await databaseService.schedule_ads.updateOne(
        {
          user_id: new ObjectId(user_id as string),
          date_start
        },
        {
          $push: {
            camp_id: {
              $each: differenceCamp
            }
          }
        }
      )
    } else {
      await databaseService.schedule_ads.insertOne(new ScheduleCamp(body))
    }
  }

  async CreateRuleCampaigns(body: any) {
    await databaseService.rule_camp.insertOne(new RuleCamp(body))
  }

  async AddRuleCampaigns(body: AddRuleToCampRequest) {
    await databaseService.rule_camp.updateOne(
      {
        _id: body._id
      },
      {
        $set: {
          atc_id: body.atc_id
        }
      }
    )
  }
  async GetRuleCampaigns(user_id: string) {
    return await databaseService.rule_camp
      .find({
        user_id: new ObjectId(user_id)
      })
      .toArray()
  }
  async GetRuleDetailCampaigns({ user_id, atc_id }: { user_id: string; atc_id: string }) {
    return await databaseService.rule_camp
      .find({
        user_id: new ObjectId(user_id),
        atc_id: atc_id
      })
      .toArray()
  }

  async DeleteRuleCampaigns({ user_id, _id }: { user_id: string; _id: string }) {
    await databaseService.rule_camp.deleteOne({
      user_id: new ObjectId(user_id),
      _id: new ObjectId(_id)
    })
  }

  async UpdateRuleCampaigns({ user_id, _id, ...body }: { user_id: string; _id: string }) {
    await databaseService.rule_camp.updateOne(
      {
        user_id: new ObjectId(user_id),
        _id: new ObjectId(_id)
      },
      {
        $set: body
      }
    )
  }

  async GetTotalCampPaused(atc_id: string) {
    const result = await databaseService.rule_camp
      .find({
        atc_id: atc_id,
        camp_paused: { $exists: true }
      })
      .toArray()
    let total = 0
    result.forEach((item) => {
      total += item.camp_paused.length
    })
    return total
  }
}

const scheduleCampServices = new ScheduleCampServices()
export default scheduleCampServices

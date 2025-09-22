import axios from 'axios'
import cron from 'node-cron'
import databaseService from 'services/database.services'
import dotenv from 'dotenv'
import _ from 'lodash'
import dayjs from 'dayjs'
import { ObjectId } from 'mongodb'
import axiosRetry from 'axios-retry'
import { getRandomAgeMax, getRandomAgeMin, getRandomRadius } from '~/utils/other'
const scheduledTasks = new Set()

type TargetingObject = {
  age_max: number
  age_min: number
  geo_locations: {
    cities?: {
      country: string
      distance_unit: string
      key: string
      name: string
      radius: number
      region: string
      region_id: string
    }[]
    custom_locations?: {
      distance_unit: string
      latitude: number
      longitude: number
      radius: number
      primary_city_id: number
      region_id: number
      country: string
    }[]
    location_types?: string[]
  }
  locales?: number[]
  publisher_platforms?: string[]
  facebook_positions?: string[]
  device_platforms?: string[]
}

const type = 'onsite_conversion.messaging_conversation_started_7d' as const

dotenv.config()
const access_token = process.env.ACCESS_TOKEN_FB

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => {
    return retryCount * 3000
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error) || error.code === 'ECONNABORTED'
  }
})

export interface Actions {
  action_type: string
  value: string
}

export interface InsgightsOfCampaign {
  campaign_name: string
  cpm: string
  ctr: string
  spend: string
  account_currency: string
  actions: Actions[]
  adset_id: string
  campaign_id: string
  status?: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const ScheduleCamp = async (campIds: any) => {
  try {
    await Promise.all(
      campIds.map(async (campId: any) => {
        console.log(`Activating campaign: ${campId}`)
        await axios.post(`https://graph.facebook.com/v21.0/${campId}`, {
          status: 'ACTIVE',
          access_token: access_token
        })
        console.log(`Campaign ${campId} activated.`)
      })
    )
  } catch (error) {
    console.error(`Error activating campaigns:`, error)
  }
}

const removeCampDuplicated = async () => {
  const totalCampCare = await databaseService.rule_camp.find().toArray()
  if (totalCampCare.length > 0) {
    await databaseService.rule_camp.updateMany(
      {
        camp_duplicated: {
          $exists: true
        }
      },
      {
        $set: {
          camp_duplicated: []
        }
      }
    )
  }
}

const checkAndScheduleTasks = async () => {
  try {
    console.log('Checking for new tasks...')
    const camps = await databaseService.schedule_ads.find().toArray()
    camps.forEach((camp) => {
      const scheduleTime = dayjs(camp.date_start)
      if (!scheduledTasks.has(camp._id) && scheduleTime.isAfter(dayjs())) {
        const cronTime = `${scheduleTime.minute()} ${scheduleTime.hour()} ${scheduleTime.date()} ${scheduleTime.month() + 1} *`
        cron.schedule(cronTime, () => {
          ScheduleCamp(camp.camp_id).catch((err) => {
            console.error(`Error scheduling campaigns for ID ${camp._id}:`, err)
          })
        })

        console.log(`Scheduled task for campaign ID ${camp._id} at ${scheduleTime.format('YYYY-MM-DD HH:mm:ss')}`)
        scheduledTasks.add(camp._id)
      }
    })
  } catch (error) {
    console.error('Error checking and scheduling tasks:', error)
  }
}

const duplicateCampaign = async ({
  id,
  isChangeAge,
  isChangePosition
}: {
  id: string
  isChangeAge: boolean
  isChangePosition: boolean
}) => {
  try {
    const [oldCamp, newCamp] = await Promise.all([
      axios.get(`https://graph.facebook.com/v21.0/${id}?fields=ads,adsets{id},account_id&access_token=${access_token}`),
      axios.post(
        `https://graph.facebook.com/v21.0/${id}/copies?status_option=ACTIVE&rename_options={"rename_suffix":"- AUTO"}`,
        {
          access_token: access_token
        }
      )
    ])

    let newCampId = ''
    let adsetIdOld = ''
    let adsIdOld = ''
    let newAdSetId = ''
    let account_id = ''
    if (newCamp.data) {
      newCampId = newCamp.data.ad_object_ids[0].copied_id
    }

    if (oldCamp.data) {
      adsetIdOld = oldCamp.data.adsets.data[0].id
      adsIdOld = oldCamp.data.ads.data[0].id
      account_id = `act_${oldCamp.data.account_id}`
    }

    const [AdsetOld, AdOld] = await Promise.all([
      axios.get(
        `https://graph.facebook.com/v21.0/${adsetIdOld}?fields=name,optimization_goal,billing_event,promoted_object,destination_type,targeting&access_token=${access_token}`
      ),
      axios.get(`https://graph.facebook.com/v21.0/${adsIdOld}?fields=creative,name&access_token=${access_token}`)
    ])

    let newTargeting = {} as any

    let newCreativeId = ''
    let nameAdsOld = ''
    if (AdsetOld.data) {
      const dataAdsetOld = AdsetOld.data
      const odlTargeting = AdsetOld.data.targeting as TargetingObject
      const dataAdsetOldWithoutTargeting = _.omit(dataAdsetOld, 'targeting', 'id')
      if (isChangeAge) {
        odlTargeting.age_max = getRandomAgeMax()
        odlTargeting.age_min = getRandomAgeMin()
      }
      if (isChangePosition && odlTargeting?.geo_locations?.custom_locations) {
        const customLocations = odlTargeting.geo_locations.custom_locations

        if (customLocations.length > 3) {
          const randomIndices = _.sampleSize(
            Array.from({ length: customLocations.length }, (_, i) => i),
            3
          )
          odlTargeting.geo_locations.custom_locations = customLocations.map((location: any, index: any) =>
            randomIndices.includes(index) ? { ...location, radius: getRandomRadius(location.radius) } : location
          )
        } else {
          odlTargeting.geo_locations.custom_locations = customLocations.map((location: any) => ({
            ...location,
            radius: getRandomRadius(location.radius)
          }))
        }
      }
      newTargeting = {
        targeting: { ...odlTargeting },
        campaign_id: newCampId,
        name: `${dataAdsetOld.name} - AUTO`,
        start_time: dayjs().toISOString(),
        status: 'ACTIVE',
        ...dataAdsetOldWithoutTargeting,
        optimization_goal: 'CONVERSATIONS'
      }
    }

    if (AdOld.data) {
      newCreativeId = AdOld.data.creative.id
      nameAdsOld = AdOld.data.name
    }
    await delay(1000)
    const newAdset = await axios.post(`https://graph.facebook.com/v21.0/${account_id}/adsets`, {
      ...newTargeting,
      access_token: access_token
    })
    if (newAdset.data) {
      newAdSetId = newAdset.data.id
    }

    const newAdData = {
      adset_id: newAdSetId,
      creative: {
        creative_id: newCreativeId
      },
      name: `${nameAdsOld} - AUTO`,
      status: 'ACTIVE'
    }

    await axios.post(`https://graph.facebook.com/v21.0/${account_id}/ads`, {
      ...newAdData,
      access_token: access_token
    })
    await delay(3000)
  } catch (error) {
    console.error(error)
    return
  }
}

const checkCampaign = async () => {
  try {
    const totalCampCare = (await databaseService.rule_camp.find().toArray()).filter((item) => item.atc_id !== '')

    totalCampCare.map(async (campCare) => {
      const totalCamp = await axios
        .get<{
          data: InsgightsOfCampaign[]
        }>(
          `https://graph.facebook.com/v21.0/${campCare.atc_id}/insights?fields=campaign_name,spend,account_currency,account_name,actions,adset_id,campaign_id,ctr,cpm&level=adset&date_preset=today&filtering=[{"field":"campaign.name","operator":"CONTAIN","value":"${campCare.branch}"},{"field":"campaign.name","operator":"CONTAIN","value":"${campCare.service}"},{"field":"campaign.name","operator":"NOT_CONTAIN","value":"TEST"}]&limit=1000&access_token=${access_token}`,
          {
            timeout: 90000
          }
        )
        .catch((error) => {
          console.error('Error fetching campaign insights:', error)
          return { data: { data: [] } }
        })
      const thresholdMap = campCare.thresholdMap
      const spendCtr = Number(campCare.spendCtr)
      const spendCtrFirst = Number(campCare.spendCtrFirst)
      const cpmlimit = Number(campCare.cpmlimit)
      const spendCpm = Number(campCare.spendCpm)
      const ctrLimit = Number(campCare.ctrLimit)
      const maxCampduplicated = Number(campCare.maxDuplicate)
      const campHadDuplicated = campCare.camp_duplicated
      const isChaneAge = campCare.isChangeAge
      const numberDuplicate = Number(campCare.numberDuplicate)
      const isChangePosition = campCare.isChangePosition
      const atc_id = campCare.atc_id
      const rule_id = campCare._id
      const camp_paused = campCare.camp_paused
      const log: string[] = []
      const camDuplicated: string[] = []
      const campId = totalCamp.data.data
        .map((camp) => {
          const currency = 25369.0
          const currencyTbh = 750.0
          const time = dayjs().format('YYYY-MM-DD HH:mm')
          const account_currency = camp.account_currency
          const spend =
            account_currency === 'VND'
              ? Number(camp.spend)
              : account_currency === 'USD'
                ? Number(camp.spend) * currency
                : Number(camp.spend) * currencyTbh
          const ctr = Number(camp.ctr)
          const actionValue = Number(camp?.actions?.find((item) => item?.action_type === type)?.value || 0)
          const cpm = Number(camp.cpm)
          const camp_id = camp.campaign_id
          if (actionValue > 0 && campHadDuplicated.length < maxCampduplicated) {
            const hadDuplicate = campHadDuplicated.includes(camp_id)
            if (!hadDuplicate) {
              for (let i = 0; i < numberDuplicate; i++) {
                duplicateCampaign({
                  id: camp_id,
                  isChangeAge: isChaneAge,
                  isChangePosition: isChangePosition
                })
              }
              camDuplicated.push(camp_id)
            }
          }

          if (spend > spendCtr && ctr < ctrLimit && actionValue === 0) {
            console.log('Campaign to pause:,1', camp_id)
            log.push(`${time} Đã tắt camp ${camp_id} vì ctr thấp ${ctr} và chi phí ${spend} > ${spendCtr}`)
            return camp_id
          }
          if (cpm > cpmlimit && spend > spendCpm && actionValue === 0) {
            console.log('Campaign to pause:,2', camp_id)
            log.push(`Đã tắt camp ${camp_id} vì cpm (${cpm}) > ${cpmlimit} và chi phí ${spend} > ${spendCpm}`)
            return camp_id
          }
          if (ctr === 0 && spend > spendCtrFirst && actionValue === 0) {
            console.log('Campaign to pause:,3', camp_id)
            log.push(`${time} Đã tắt camp ${camp_id} vì ctr = 0 và chi phí ${spend} > ${spendCtrFirst}`)
            return camp_id
          }
          for (const [threshold, thresholdValue] of Object.entries(thresholdMap)) {
            const thresholdNumber = Number(threshold)
            if (actionValue < thresholdNumber && spend > thresholdValue) {
              log.push(
                `${time} Đã tắt camp ${camp_id} vì tương tác < ${thresholdNumber} và chi phí ${spend} > ${
                  thresholdValue
                }`
              )
              return camp_id
            }
          }
          return undefined
        })
        .filter((id): id is string => Boolean(id))

      await databaseService.rule_camp.updateOne(
        {
          atc_id: atc_id,
          _id: new ObjectId(rule_id)
        },
        {
          $set: {
            camp_paused: campId
          },
          $addToSet: {
            camp_duplicated: {
              $each: camDuplicated
            }
          }
        }
      )

      const removeCampHasPaused = _.difference(campId, camp_paused)
      const finalLog = log.filter((item) => {
        const camp = item.split(' ')[5]
        return removeCampHasPaused.includes(camp)
      })
      await databaseService.rule_camp.updateOne(
        {
          atc_id: atc_id,
          _id: new ObjectId(rule_id)
        },
        {
          $push: {
            log: {
              $each: finalLog
            }
          }
        }
      )
      console.log(finalLog, 'finalLog')

      if (removeCampHasPaused.length > 0) {
        await Promise.all(
          removeCampHasPaused.map(async (campId: any) => {
            try {
              await axios.post(`https://graph.facebook.com/v21.0/${campId}`, {
                status: 'PAUSED',
                access_token: access_token
              })
              await delay(7000)
            } catch (error) {
              console.log(error)
              return
            }
          })
        )
      } else {
        console.log('No campaigns to pause.')
      }
    })
  } catch (error) {
    console.log(error)
    return
  }
}

const taskCheckCampaign = cron.schedule('*/10 * * * *', () => {
  checkCampaign().catch((_) => {
    return null
  })
})

const taskRemoveCampDuplicated = cron.schedule('0 0 * * *', () => {
  removeCampDuplicated().catch((_) => {
    return null
  })
})

taskRemoveCampDuplicated.start()

cron.schedule('*/50 * * * *', checkAndScheduleTasks)
taskCheckCampaign.start()

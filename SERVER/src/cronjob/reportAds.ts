import axios from 'axios'
import cron from 'node-cron'
import reportFinanceServices from 'services/reportFinance.services'
const access_token = process.env.ACCESS_TOKEN_FB
import axiosRetry from 'axios-retry'
import dayjs from 'dayjs'
import { isLessThanTenMinutes, timeArrayToday, timeArrayYesterDay } from '~/utils/other'
import _ from 'lodash'
import { CurrencyType } from '~/constants/enum'

export interface FacebookAccount {
  id: string
  timezone_offset_hours_utc: number
  name: string
  currency: string
  account_status: number
  balance: string
  insights: {
    data: {
      spend: string
      account_id: string
    }[]
  }
  spend?: number
}

interface FacebookAccountDetail {
  account_id: string
  campaign_id: string
  account_name: string
  campaign_name: string
  date_start: string
  date_stop: string
  spend: number
  account_currency: string
  hourly_stats_aggregated_by_advertiser_time_zone?: string
}

export enum TimeZoneType {
  UTCPlus7 = 7,
  GMTMinus7 = -7
}

export interface ActivesOfAccount {
  event_time: string
  object_type: string
  object_name: string
  extra_data:
    | {
        currency: string
        new_value: number | string
        old_value: number | string
      }
    | any
  event_type: string
}

export interface ActivesOfAccount {
  event_time: string
  object_type: string
  object_name: string
  extra_data:
    | {
        currency: string
        new_value: number | string
        old_value: number | string
      }
    | any
  event_type: string
}

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => {
    return retryCount * 3000
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error) || error.code === 'ECONNABORTED'
  }
})

const category = 'ACCOUNT'
const event_type = 'ad_account_update_status'
const currencyRate = 25369.0
let today = dayjs().format('YYYY-MM-DD')

const breforeDate = dayjs(today).subtract(1, 'day').format('YYYY-MM-DD')
const nextDay = dayjs(today).add(1, 'day').format('YYYY-MM-DD')

const baseUrl = 'https://graph.facebook.com/v22.0/'

const isBefore3pm = dayjs().isBefore(dayjs().hour(15).minute(0).second(0))

const getAdsAccountHasSpend = (date: string) => {
  date = date || new Date().toISOString().slice(0, 10)
  return axios.get<{
    data: FacebookAccount[]
  }>(
    `${baseUrl}me/adaccounts?fields=timezone_offset_hours_utc,name,account_status,currency,balance,insights.time_range({"since":"${date}","until":"${date}"}).level(account){account_id,spend}&limit=100&access_token=${access_token}`,
    {
      timeout: 90000
    }
  )
}

const batchRequestActives = (ids: string[]) => {
  return ids.map((id) => {
    return {
      method: 'GET',
      relative_url: `${id}/activities?fields=event_time,object_type,extra_data,event_type,object_name&until=${today}&since=${breforeDate}&category=${category}&limit=100`
    }
  })
}

const pauseCampaign = async (id: string[]) => {
  const batch = id.map((id) => {
    return {
      method: 'POST',
      relative_url: `${id}/campaigns?status=PAUSED`
    }
  })
  return axios.post(`${baseUrl}`, {
    access_token: access_token,
    batch: batch
  })
}

const groupedGmt = (data: any) => {
  const dataUnique = _.uniqWith(data, _.isEqual)
  const spend = dataUnique.reduce((spend: number, item: FacebookAccountDetail) => {
    const hour = item.hourly_stats_aggregated_by_advertiser_time_zone
    const date_start = item.date_start
    const account_currency = item.account_currency
    const isVND = account_currency === CurrencyType.VND
    const isTodayAndAfter3pm = date_start === today && isBefore3pm
    const isBeforeSelecDate = breforeDate === date_start
    if (timeArrayToday.includes(hour as string) && (isTodayAndAfter3pm || date_start === today)) {
      spend += isVND ? Number(item.spend) : Number(item.spend) * currencyRate
    }
    if (timeArrayYesterDay.includes(hour as string) && isBeforeSelecDate) {
      spend += isVND ? Number(item.spend) : Number(item.spend) * currencyRate
    }
    return spend
  }, 0)
  return spend
}

const bathRequestAccountHasSpendGMT = (ids: string[]) => {
  const limit = '2000'
  const bathrequestToday = ids.map((id) => {
    return {
      method: 'GET',
      relative_url: `${id}/insights?fields=account_id,campaign_name,date_start,date_stop,spend,account_currency,account_name&limit=${limit}&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&Level=campaign&time_range={"since":"${today}","until":"${today}"}`
    }
  })
  const bathrequestYesterday = ids.map((id) => {
    return {
      method: 'GET',
      relative_url: `${id}/insights?fields=account_id,campaign_name,date_start,date_stop,spend,account_currency,account_name&limit=${limit}&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&Level=campaign&time_range={"since":"${breforeDate}","until":"${breforeDate}"}`
    }
  })
  return bathrequestToday.concat(bathrequestYesterday)
}

const getActivesOfAccount = async (ids: string[]) => {
  const chunkSize = 50
  const accountChunks = []
  for (let i = 0; i < ids.length; i += chunkSize) {
    accountChunks.push(ids.slice(i, i + chunkSize))
  }
  const responses = await Promise.all(
    accountChunks.map((chunk) => {
      return axios.post(`${baseUrl}`, {
        access_token: access_token,
        batch: batchRequestActives(chunk)
      })
    })
  )

  const allData = responses
    .flatMap((response) => response.data)
    .map((item) => JSON.parse(item.body).data)
    .filter((item) => item.length > 0)
    .flat()
    .filter((item: ActivesOfAccount) => item.event_type === event_type)

  const accountDisable = allData.map((item: ActivesOfAccount) => {
    const statusAccountDisable = 'Disabled'
    const { old_value, event_time } = JSON.parse(item.extra_data)
    const isValidTime = isLessThanTenMinutes(new Date(event_time))
    if (old_value === statusAccountDisable && isValidTime) {
      return item.object_name
    }
  })
  return accountDisable.filter((item) => Boolean(item))
}

const getTotalSpenGMT = async (ids: string[]) => {
  const chunkSize = 50
  const accountChunks = []
  for (let i = 0; i < ids.length; i += chunkSize) {
    accountChunks.push(ids.slice(i, i + chunkSize))
  }

  const responses = await Promise.all(
    accountChunks.map((chunk) => {
      return axios.post(
        `${baseUrl}`,
        {
          access_token: access_token,
          batch: bathRequestAccountHasSpendGMT(chunk)
        },
        {
          timeout: 90000
        }
      )
    })
  )
  const allData = responses
    .flatMap((response) => response?.data)
    .map((item) => JSON.parse(item?.body)?.data)
    .filter((item) => item?.length > 0)
    .flat()
  return groupedGmt(allData)
}

const getFinanceReportOfAccount = async (retryCount = 0) => {
  try {
    const result = await getAdsAccountHasSpend(today)
    let spend = 0
    let balance = 0

    const accounts = result.data.data
    const idsGMT: string[] = []

    accounts.forEach((account) => {
      const timeHourse = account.timezone_offset_hours_utc
      const haspend = account?.insights?.data?.length > 0
      if (timeHourse !== TimeZoneType.UTCPlus7) {
        idsGMT.push(account.id)
      }
      if (timeHourse === TimeZoneType.UTCPlus7 && haspend) {
        const currency = account.currency
        currency === CurrencyType.VND
          ? (balance += Number(account.balance))
          : (balance += Number(account.balance) * currencyRate)
        currency === CurrencyType.VND
          ? (spend += Number(account.insights.data[0].spend))
          : (spend += Number(account.insights.data[0].spend) * currencyRate)
      }
    })

    const spendGMT = await getTotalSpenGMT(idsGMT)
    const totalSpend = spend + spendGMT

    const body = {
      date: today,
      balanceEndDay: balance,
      spend: totalSpend
    }

    const bodyNextDate = {
      date: nextDay,
      balancePreviousDay: balance,
      spend: 0,
      balanceEndDay: 0
    }

    await Promise.all([
      reportFinanceServices.CreateReportFinance(body),
      reportFinanceServices.CreateReportFinance(bodyNextDate)
    ])
  } catch (error) {
    console.log('error', error)
    if (retryCount < 5) {
      return getFinanceReportOfAccount(retryCount + 1)
    }
    return
  }
}

const checkAccountDisable = async () => {
  try {
    const result = await getAdsAccountHasSpend(today)
    const accounts = result.data.data
    const mapAccount = accounts.reduce((acc: { [key: string]: string }[], account: FacebookAccount) => {
      acc.push({
        [account.name]: account.id
      })
      return acc
    }, [])
    const totalIds = accounts.map((account) => account.id)
    const object_name = await getActivesOfAccount(totalIds)
    console.log('object_name', object_name)
    if (object_name.length > 0) {
      const mapAccountDict: { [key: string]: string } = mapAccount.reduce((acc, item) => {
        const [key, value] = Object.entries(item)[0]
        acc[key] = value
        return acc
      }, {})
      const Ids = object_name.map((name) => mapAccountDict[name as string])
      await pauseCampaign(Ids)
    }
  } catch (error) {
    console.log('error', error)
    return
  }
}

const taskGetBalanceOfAccount = cron.schedule('55 23 * * *', () => {
  getFinanceReportOfAccount().catch((_) => {
    return null
  })
})

const taskCheckAccountDisable = cron.schedule('*/30 * * * *', () => {
  checkAccountDisable().catch((_) => {
    return null
  })
})

cron.schedule('0 0 * * *', () => {
  today = dayjs().format('YYYY-MM-DD')
})

taskGetBalanceOfAccount.start()

// taskCheckAccountDisable.start()

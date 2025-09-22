const access_token = process.env.ACCESS_TOKEN_FB
import axios from 'axios'
import { FacebookAccount } from './reportAds'
import dayjs from 'dayjs'
import databaseService from 'services/database.services'
import { ObjectId } from 'mongodb'
const baseUrl = 'https://graph.facebook.com/v22.0/'

const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

const handleGetAdsAccount = async (date: string) => {
  const result = await axios.get(
    `${baseUrl}me/adaccounts?fields=insights.time_range({"since":"${date}","until":"${date}"}).level(account){account_id,spend}&limit=300&access_token=${access_token}`
  )
  const accountHasSpend = result.data.data.filter((item: FacebookAccount) => item.insights !== undefined)
  const ids = accountHasSpend.map((item: FacebookAccount) => item.id)
  return ids
}

const getInsightOffAccounts = async (ids: string[], date: string) => {}

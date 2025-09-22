import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import User from 'User.schema'
import Customer from '~/models/schemas/Customers.schema'
import CustomerOfTelesales from '~/models/schemas/CustomerOfTelesales.schema'
import CallMinutesOfTelesales from '~/models/schemas/CallMinutesOfTelesales.chema'
import HistoryCallOfTelesales from '~/models/schemas/HistoryCallOfTelesales.schema'
import ScheduleCamp from '~/models/schemas/ScheduleCamp.schema'
import RuleCamp from '~/models/schemas/RuleControllerCapm'
import ReportAds from '~/models/schemas/ReportAds.schema'
import { BranchOfTelesales } from '~/models/schemas/branchOfTelesales.schema'
dotenv.config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@megakorae-call.rrq1b.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=MEGAKORAE-CALL&tls=true`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    // eslint-disable-next-line no-useless-catch
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      throw error
    }
  }

  async indexCustomer() {
    const exsit = await this.customers.indexExists('phone_text')
    if (!exsit) {
      await this.customers.createIndex({ phone_text: 'text' }, { default_language: 'none' })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.USERS_COLLECTION as string)
  }
  get customers(): Collection<Customer> {
    return this.db.collection(process.env.CUSTOMERS_COLLECTION as string)
  }
  get customers_of_telesales(): Collection<CustomerOfTelesales> {
    return this.db.collection(process.env.CUSTOMERS_OF_TELESALES_COLLECTION as string)
  }
  get call_minutes_of_telesales(): Collection<CallMinutesOfTelesales> {
    return this.db.collection(process.env.CALL_MINUTES_OF_TELESALES_COLLECTION as string)
  }
  get call_minutes_of_telesales_expired(): Collection<CallMinutesOfTelesales> {
    return this.db.collection(process.env.CALL_MINUTES_OF_TELESALES_EXPIRED_COLLECTION as string)
  }
  get history_call_of_telesales(): Collection<HistoryCallOfTelesales> {
    return this.db.collection(process.env.HISTORY_CALL_OF_TELESALES_COLLECTION as string)
  }
  get schedule_ads(): Collection<ScheduleCamp> {
    return this.db.collection(process.env.SCHEDULE_ADS_COLLECTION as string)
  }
  get rule_camp(): Collection<RuleCamp> {
    return this.db.collection(process.env.RULE_CAMP_COLLECTION as string)
  }
  get report_ads(): Collection<ReportAds> {
    return this.db.collection(process.env.REPORT_ADS_COLLECTION as string)
  }
  get report_finance(): Collection<ReportAds> {
    return this.db.collection(process.env.REPORT_FINANCE_COLLECTION as string)
  }
  get branch_of_telesales(): Collection<BranchOfTelesales> {
    return this.db.collection(process.env.BRANCH_OF_TELESALES_COLLECTION as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService

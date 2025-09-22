import { Router } from 'express'
import { update } from 'lodash'
import {
  addRuleControllerCamp,
  createRuleControllerCamp,
  createScheduleCamp,
  deleteRuleController,
  getRuleControllerCamp,
  getRuleDetailControllerCamp,
  getTotalCampaused,
  updateRuleController
} from '~/controllers/scheduleAds.controllers'

import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const scheduleAdsRoutes = Router()

scheduleAdsRoutes.post('/create', accessTokenValidator, wrapRequestHandler(createScheduleCamp))

scheduleAdsRoutes.post('/create-rule', accessTokenValidator, wrapRequestHandler(createRuleControllerCamp))

scheduleAdsRoutes.post('/add-rule', accessTokenValidator, wrapRequestHandler(addRuleControllerCamp))

scheduleAdsRoutes.get('/get-rule', accessTokenValidator, wrapRequestHandler(getRuleControllerCamp))

scheduleAdsRoutes.post('/get-rule-detail', accessTokenValidator, wrapRequestHandler(getRuleDetailControllerCamp))

scheduleAdsRoutes.delete('/delete-rule/:rule_id', accessTokenValidator, wrapRequestHandler(deleteRuleController))

scheduleAdsRoutes.patch('/update-rule/:rule_id', accessTokenValidator, wrapRequestHandler(updateRuleController))

scheduleAdsRoutes.get('/total-camp-paused/:atc_id', accessTokenValidator, wrapRequestHandler(getTotalCampaused))

export default scheduleAdsRoutes

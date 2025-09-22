import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import scheduleCampService from '../../services/scheduleAds.services'
import { TokenPayload } from '~/models/requestes/User.requests'
import { ObjectId } from 'mongodb'

export const createScheduleCamp = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await scheduleCampService.CreateScheduleCampaigns({
    user_id: new ObjectId(user_id),
    ...req.body
  })
  return res.status(200).json({
    success: true,
    message: 'Create schedule campaign success',
    result
  })
}

export const createRuleControllerCamp = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  await scheduleCampService.CreateRuleCampaigns({
    user_id: new ObjectId(user_id),
    ...req.body
  })
  return res.status(200).json({
    success: true,
    message: 'Create rule campaign success'
  })
}

export const addRuleControllerCamp = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  await scheduleCampService.AddRuleCampaigns({
    _id: new ObjectId(req.body.rule_id as string),
    atc_id: req.body.atc_id
  })
  return res.status(200).json({
    success: true,
    message: 'Create rule campaign success'
  })
}

export const getRuleControllerCamp = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await scheduleCampService.GetRuleCampaigns(user_id)
  return res.status(200).json({
    success: true,
    message: 'Get rule campaign success',
    result: result
  })
}

export const getRuleDetailControllerCamp = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await scheduleCampService.GetRuleDetailCampaigns({
    user_id,
    atc_id: req.body.atc_id
  })
  return res.status(200).json({
    success: true,
    message: 'Get rule campaign success',
    result: result
  })
}

export const deleteRuleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  await scheduleCampService.DeleteRuleCampaigns({
    user_id,
    _id: req.params.rule_id
  })
  return res.status(200).json({
    success: true,
    message: 'Delete rule campaign success'
  })
}

export const updateRuleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  await scheduleCampService.UpdateRuleCampaigns({
    user_id,
    _id: req.params.rule_id,
    ...req.body
  })
  return res.status(200).json({
    success: true,
    message: 'Delete rule campaign success'
  })
}

export const getTotalCampaused = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const atc_id = req.params.atc_id
  const result = await scheduleCampService.GetTotalCampPaused(atc_id)
  return res.status(200).json({
    success: true,
    message: 'Get total campaused success',
    result: result
  })
}

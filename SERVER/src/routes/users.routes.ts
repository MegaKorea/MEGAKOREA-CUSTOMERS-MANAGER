import { Router } from 'express'
import { get } from 'lodash'
import { removeCustomerFromTelesaleController, transitonCustomerController } from '~/controllers/customer.controllers'
import {
  addCustomerToTelesaleController,
  deleteUserController,
  getAllFbAdsController,
  getAllPancakeController,
  getAllTelesalesController,
  getBranchOfTelesalesController,
  getMeController,
  loginController,
  registerController,
  transitionCustomerToTelesaleAutoController,
  updateAtcUserController,
  updateBranchOfTelesalesController,
  updateBranchUserController,
  updateStatusUserController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  addCustomerToTelesaleValidator,
  isAdminValidator,
  LoginValidator,
  registerValidator,
  removeCustomerFromTelesaleValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const userRouters = Router()

userRouters.post('/login', LoginValidator, wrapRequestHandler(loginController))

userRouters.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

userRouters.post('/register', registerValidator, wrapRequestHandler(registerController))

userRouters.get('/all-telesale', accessTokenValidator, wrapRequestHandler(getAllTelesalesController))

userRouters.post(
  '/add-customer-to-telesale',
  accessTokenValidator,
  addCustomerToTelesaleValidator,
  wrapRequestHandler(addCustomerToTelesaleController)
)

userRouters.post('/transiton-customer', accessTokenValidator, wrapRequestHandler(transitonCustomerController))

userRouters.post(
  '/remove-customer-from-telesale',
  accessTokenValidator,
  isAdminValidator,
  removeCustomerFromTelesaleValidator,
  wrapRequestHandler(removeCustomerFromTelesaleController)
)

userRouters.get('/all-pancake', accessTokenValidator, wrapRequestHandler(getAllPancakeController))

userRouters.patch('/update-status', accessTokenValidator, wrapRequestHandler(updateStatusUserController))

userRouters.patch('/update-branch', accessTokenValidator, wrapRequestHandler(updateBranchUserController))

userRouters.patch('/update-atc', accessTokenValidator, wrapRequestHandler(updateAtcUserController))

userRouters.delete('/:telesale_id', accessTokenValidator, wrapRequestHandler(deleteUserController))

userRouters.get('/all-fb-ads', accessTokenValidator, wrapRequestHandler(getAllFbAdsController))

userRouters.get('/branch-of-telesales', accessTokenValidator, wrapRequestHandler(getBranchOfTelesalesController))

userRouters.get(
  '/transition-customer-to-telesale-auto',
  accessTokenValidator,
  wrapRequestHandler(transitionCustomerToTelesaleAutoController)
)

userRouters.patch(
  '/update-branch-of-telesales',
  accessTokenValidator,
  wrapRequestHandler(updateBranchOfTelesalesController)
)

userRouters.get('/branch-of-telesales', accessTokenValidator, wrapRequestHandler(updateBranchOfTelesalesController))

export default userRouters

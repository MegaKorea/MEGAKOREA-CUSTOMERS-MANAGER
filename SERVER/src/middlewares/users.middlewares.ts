import { checkSchema } from 'express-validator'
import databaseService from 'services/database.services'
import usersService from 'services/users.services'
import { customerMessages, userMessages } from '~/constants/messages'
import { hashPassword } from '~/utils/crypro'
import { verifyAccessToken } from '~/utils/other'
import { validate } from '~/utils/validation'
import { Request } from 'express'
import { ObjectId } from 'mongodb'
import { TokenPayload } from '~/models/requestes/User.requests'
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: userMessages.NAME_REQUIRED
        },
        isString: {
          errorMessage: userMessages.NAME_MUST_BE_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 255
          },
          errorMessage: userMessages.NAME_LENGTH
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: userMessages.EMAIL_REQUIRED
        },
        isEmail: {
          errorMessage: userMessages.EMAIL_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExistsEmail = await usersService.checkEmail(value)
            if (isExistsEmail) {
              throw new Error(userMessages.EMAIL_EXISTS)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: userMessages.PASSWORD_REQUIRED
        },
        isString: {
          errorMessage: userMessages.PASSWORD_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
        },
        isStrongPassword: {
          options: {
            minLowercase: 1,
            minNumbers: 1,
            minLength: 1,
            minUppercase: 1,
            minSymbols: 1
          },
          errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
        }
      },
      confirmPassword: {
        notEmpty: {
          errorMessage: userMessages.CONFIRM_PASSWORD_REQUIRED
        },
        isString: {
          errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        isStrongPassword: {
          options: {
            minLowercase: 1,
            minNumbers: 1,
            minLength: 1,
            minUppercase: 1,
            minSymbols: 1
          },
          errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(userMessages.PASSWORDS_NOT_MATCH)
            } else {
              return value
            }
          }
        }
      }
    },
    ['body']
  )
)

export const LoginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: userMessages.EMAIL_REQUIRED
        },
        isEmail: {
          errorMessage: userMessages.EMAIL_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(userMessages.EMAIL_OR_PASSWORD_INVALID)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: userMessages.PASSWORD_REQUIRED
        },
        isString: {
          errorMessage: userMessages.PASSWORD_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
        },
        isStrongPassword: {
          options: {
            minLowercase: 1,
            minNumbers: 1,
            minLength: 1,
            minUppercase: 1,
            minSymbols: 1
          },
          errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            return await verifyAccessToken(access_token, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)

export const addCustomerToTelesaleValidator = validate(
  checkSchema(
    {
      customer_id: {
        notEmpty: {
          errorMessage: userMessages.CUSTOMER_ID_REQUIRED
        },
        isMongoId: {
          errorMessage: userMessages.CUSTOMER_ID_INVALID
        }
      },
      telesale_id: {
        notEmpty: {
          errorMessage: userMessages.TELESALE_ID_REQUIRED
        },
        isMongoId: {
          errorMessage: userMessages.TELESALE_ID_INVALID
        }
        // custom: {
        //   options: async (value, { req }) => {
        //     const { role } = req.decode_authorization as TokenPayload
        //     if (role !== 'ADMIN_PANCAKE' && role !== 'ADMIN_TELESALES') {
        //       throw new Error('You are not allowed add customer to telesales')
        //     }
        //     const telesale = await databaseService.users.findOne({
        //       _id: new ObjectId(value as string),
        //       role: 'TELESALE'
        //     })
        //     if (!telesale) {
        //       throw new Error(userMessages.TELESALE_ID_INVALID)
        //     }

        //     return true
        //   }
        // }
      },
      date: {
        notEmpty: {
          errorMessage: userMessages.DATE_REQUIRED
        }
      }
    },
    ['body']
  )
)

export const transitionCustomerValidator = validate(
  checkSchema(
    {
      customer_id: {
        notEmpty: {
          errorMessage: userMessages.CUSTOMER_ID_REQUIRED
        },
        isArray: {
          errorMessage: userMessages.CUSTOMER_ID_MUST_BE_ARRAY
        }
      },
      telesale_id_old: {
        notEmpty: {
          errorMessage: userMessages.TELESALE_ID_INVALID
        },
        isMongoId: {
          errorMessage: userMessages.TELESALE_ID_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const { role } = req.decode_authorization as TokenPayload
            if (role !== 'ADMIN_PANCAKE' && role !== 'ADMIN_TELESALES') {
              throw new Error('You are not allowed to transition customer')
            }
            const telesale = await databaseService.users.findOne({
              _id: new ObjectId(value as string),
              role: 'TELESALE'
            })
            if (!telesale) {
              throw new Error(userMessages.TELESALE_ID_INVALID)
            }
            return true
          }
        }
      },
      telesale_id_new: {
        notEmpty: {
          errorMessage: userMessages.TELESALE_ID_NEW_REQUIRED
        },
        isMongoId: {
          errorMessage: userMessages.TELESALE_ID_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const telesale = await databaseService.users.findOne({
              _id: new ObjectId(value as string),
              role: 'TELESALE'
            })
            if (!telesale) {
              throw new Error(userMessages.TELESALE_ID_INVALID)
            }

            return true
          }
        }
      },
      date: {
        notEmpty: {
          errorMessage: userMessages.DATE_REQUIRED
        }
      }
    },
    ['body']
  )
)

export const isAdminValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const { role } = req.decode_authorization as TokenPayload
            if (role !== 'ADMIN_PANCAKE' && role !== 'ADMIN_TELESALES') {
              throw new Error('You are not allowed to do this action')
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const removeCustomerFromTelesaleValidator = validate(
  checkSchema(
    {
      customer_id: {
        notEmpty: {
          errorMessage: userMessages.CUSTOMER_ID_REQUIRED
        },
        isMongoId: {
          errorMessage: userMessages.CUSTOMER_ID_INVALID
        }
      },
      telesale_id: {
        notEmpty: {
          errorMessage: userMessages.TELESALE_ID_REQUIRED
        },
        isMongoId: {
          errorMessage: userMessages.TELESALE_ID_INVALID
        }
      }
    },
    ['body']
  )
)

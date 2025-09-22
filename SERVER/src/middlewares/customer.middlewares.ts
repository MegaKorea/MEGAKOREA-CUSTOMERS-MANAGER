import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import databaseService from 'services/database.services'
import { HttpStatusCode } from '~/constants/enum'
import { customerMessages } from '~/constants/messages'
import { ErrorWithStatusCode } from '~/models/Errors'
import { TokenPayload } from '~/models/requestes/User.requests'
import { validate } from '~/utils/validation'

export const addCustomerValidator = validate(
  checkSchema(
    {
      phone: {
        notEmpty: {
          errorMessage: 'Phone is required'
        },
        isString: {
          errorMessage: 'Phone must be a string'
        }
      },
      source: {
        notEmpty: {
          errorMessage: 'Source is required'
        },
        isString: {
          errorMessage: 'Source must be a string'
        }
      },
      date: {
        notEmpty: {
          errorMessage: 'Date is required'
        }
      },
      branch: {
        notEmpty: {
          errorMessage: 'Branch is required'
        },
        isString: {
          errorMessage: 'Branch must be a string'
        }
      },
      // role: {
      //   custom: {
      //     options: (value, { req }) => {
      //       const { role } = req.decode_authorization as TokenPayload
      //       if (role !== 'ADMIN_TELESALES') {
      //         throw new Error('You are not allowed to add customer')
      //       }
      //       return true
      //     }
      //   }
      // },
      sex: {
        notEmpty: {
          errorMessage: 'Sex is required'
        }
      },
      service: {
        notEmpty: {
          errorMessage: 'Service is required'
        },
        isArray: {
          errorMessage: 'Service must be an array'
        }
      },
      pancake: {
        notEmpty: {
          errorMessage: 'Pancake is required'
        }
      }
    },
    ['body']
  )
)

export const addCustomerByTelesasleValidator = validate(
  checkSchema(
    {
      phone: {
        notEmpty: {
          errorMessage: 'Phone is required'
        },
        isString: {
          errorMessage: 'Phone must be a string'
        }
      },
      source: {
        notEmpty: {
          errorMessage: 'Source is required'
        },
        isString: {
          errorMessage: 'Source must be a string'
        }
      },
      date: {
        notEmpty: {
          errorMessage: 'Date is required'
        }
      },
      branch: {
        notEmpty: {
          errorMessage: 'Branch is required'
        },
        isString: {
          errorMessage: 'Branch must be a string'
        }
      },
      sex: {
        notEmpty: {
          errorMessage: 'Sex is required'
        }
      },
      service: {
        notEmpty: {
          errorMessage: 'Service is required'
        },
        isArray: {
          errorMessage: 'Service must be an array'
        }
      },
      pancake: {
        notEmpty: {
          errorMessage: 'Pancake is required'
        }
      }
    },
    ['body']
  )
)

export const updateCustomerValidator = validate(
  checkSchema({
    _id: {
      notEmpty: {
        errorMessage: 'Customer ID is required'
      },
      isMongoId: {
        errorMessage: 'Customer ID is invalid'
      }
    }
  })
)

export const paginatonValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const num = Number(value)
            if (num > 100) {
              throw new Error('LIMIT_MUST_BE_LESS_THAN_100')
            } else if (num < 1) {
              throw new Error('LIMIT_MUST_BE_BIGGER_THAN_0')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const num = Number(value)
            if (num < 1) {
              throw new Error('PAGE_MUST_BE_BIGGER_THAN_0')
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)

export const searchCustomerByPhoneValidator = validate(
  checkSchema(
    {
      phone: {
        notEmpty: {
          errorMessage: 'Phone is required'
        },
        isString: {
          errorMessage: 'Phone must be a string'
        }
      }
    },
    ['body']
  )
)

export const deleteCustomerValidator = validate(
  checkSchema(
    {
      customer_id: {
        notEmpty: {
          errorMessage: 'Customer ID is required'
        },
        isMongoId: {
          errorMessage: 'Customer ID is invalid'
        },
        custom: {
          options: async (value) => {
            const customer = await databaseService.customers.findOne({
              _id: new ObjectId(value as string)
            })
            if (!customer) {
              throw new ErrorWithStatusCode({
                message: customerMessages.CUSTOMER_ID_INVALID,
                statusCode: HttpStatusCode.NotFound
              })
            }
            return true
          }
        }
      }
    },
    ['params']
  )
)

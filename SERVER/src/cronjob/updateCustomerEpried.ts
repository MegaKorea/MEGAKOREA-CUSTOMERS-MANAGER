import axios from 'axios'
import cron from 'node-cron'

const task = cron.schedule('05 01 * * *', async () => {
  await Promise.all([
    axios.get('https://api.mediccare.vn/customers/update-customer-schedule-expried'),
    axios.get('https://api.mediccare.vn/customers/update-customer-cancle-schedule')
  ])
})

// const updateCustomerExpried = async () => {
//   await databaseService.customers.updateMany(
//     {
//       'telesales_expried._id': { $ne: '' },
//       'telesales_expried.name': { $ne: '' }
//     },
//     {
//       $set: {
//         'telesales_expried._id': '',
//         'telesales_expried.name': ''
//       }
//     }
//   )
// }

// const taskUpdateCustomerEpried = cron.schedule('0 0 * * *', updateCustomerExpried)

// taskUpdateCustomerEpried.start()
task.start()

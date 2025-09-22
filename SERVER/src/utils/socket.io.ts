import { Server } from 'socket.io'
import { verifyAccessToken } from '~/utils/other'
import { TokenPayload } from '~/models/requestes/User.requests'
import databaseService from 'services/database.services'
import { ObjectId } from 'mongodb'

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}

const setupSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  })

  io.use(async (socket, next) => {
    const { Authoriration } = socket.handshake.auth
    try {
      const decode_authorization = await verifyAccessToken(Authoriration)
      socket.handshake.auth.decode_authorization = decode_authorization
      socket.handshake.auth.access_token = Authoriration
      next()
    } catch (error) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const { user_id } = socket.handshake.auth.decode_authorization as TokenPayload
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          status: 'online'
        }
      }
    )
    users[user_id] = {
      socket_id: socket.id
    }

    socket.use(async (packet: any, next: any) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })

    socket.on('error', (error: any) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    socket.on('logout', async () => {
      await databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            status: 'offline'
          }
        }
      )
      socket.disconnect()
    })

    socket.on('disconnect', () => {
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            status: 'offline'
          }
        }
      )
      delete users[user_id]
    })

    socket.on('reconnect', () => {
      users[user_id] = {
        socket_id: socket.id
      }
    })
  })

  return io
}

export default setupSocket

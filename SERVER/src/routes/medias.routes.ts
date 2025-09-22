import { Router } from 'express'
import { uploadleDocumentController, uploadleImageController } from '~/controllers/medias.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRoutes = Router()

mediasRoutes.post('/', accessTokenValidator, wrapRequestHandler(uploadleDocumentController))

mediasRoutes.post('/image', accessTokenValidator, wrapRequestHandler(uploadleImageController))

export default mediasRoutes

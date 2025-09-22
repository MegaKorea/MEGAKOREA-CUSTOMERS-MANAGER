import { HttpStatusCode } from '~/constants/enum'
import { userMessages } from '~/constants/messages'
import mediasService from '../../services/medias.services'
import { NextFunction, Request, Response } from 'express'

export const uploadleDocumentController = async (req: Request, res: Response) => {
  const result = await mediasService.UploadDocument(req)
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.UPLOAD_DOCUMENT_SUCCESS,
    result
  })
}

export const uploadleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.UploadImage(req)
  return res.status(HttpStatusCode.Ok).json({
    success: true,
    message: userMessages.UPLOAD_IMAGE_SUCCESS,
    result
  })
}

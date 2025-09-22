import formidable from 'formidable'
import { Request } from 'express'
import { File } from 'formidable'
import { UPLOAD_DOCUMENT_DIR, UPLOAD_IMAGE_TERM_DIR } from '~/constants/dir'

export const handleUploadDocument = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_DOCUMENT_DIR,
    maxFiles: 5,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    filter: function ({ name, originalFilename, mimetype }) {
      const isAudio =
        mimetype === 'audio/mpeg' ||
        mimetype === 'audio/mp3' ||
        mimetype === 'audio/wav' ||
        mimetype === 'audio/mp4' ||
        mimetype === 'audio/x-m4a' ||
        mimetype === 'audio/m4a' ||
        mimetype === 'audio/3gpp' ||
        mimetype === 'audio/3gp' ||
        mimetype === 'audio/amr' ||
        mimetype === 'application/octet-stream' ||
        mimetype === 'audio/amr-wb'
      if (!isAudio) {
        form.emit('error' as any, new Error('Chỉ cho phép tải lên tệp MP3.') as any)
        return false
      }
      return true
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files) {
        return reject(new Error('Yêu cầu có tệp tài liệu.'))
      }
      resolve(files.audio as File[])
    })
  })
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TERM_DIR,
    maxFiles: 10,
    keepExtensions: true,
    maxFileSize: 30 * 1024 * 1024,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('Invalid file type') as any)
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.image) {
        reject(new Error('Image is required'))
      }
      resolve(files.image as File[])
    })
  })
}

export const getNameFromFullName = (fullname: string) => {
  const name = fullname.split('.')[0]
  return name
}

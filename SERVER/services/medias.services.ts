import { Request } from 'express'
import { getNameFromFullName, handleUploadDocument, handleUploadImage } from '../src/utils/file'
import { UPLOAD_DOCUMENT_DIR, UPLOAD_IMAGE_DIR } from '../src/constants/dir'
import path from 'path'
import fs from 'fs'
import { config } from 'dotenv'
import { uploadFileToS3 } from '../src/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { getContentTypeByExtension } from '../src/utils/other'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import sharp from 'sharp'
sharp.cache(false)
config()

class MediasService {
  async UploadDocument(req: Request) {
    const files = await handleUploadDocument(req)
    let totalMinutes = 0
    const results: any = await Promise.all(
      files?.map(async (file) => {
        const ext = path.extname(file.newFilename).toLowerCase()
        const newName = getNameFromFullName(file.newFilename)
        const newFullFileName = `${newName}${ext}`
        const newPath = path.resolve(UPLOAD_DOCUMENT_DIR, newFullFileName)
        const contentType = getContentTypeByExtension(ext)
        let updatedPath = newPath

        if (ext === '.awb' || ext === '.m4a') {
          let outputFilePath = newPath

          if (ext === '.awb') {
            outputFilePath = path.resolve(UPLOAD_DOCUMENT_DIR, `${newName}.mp3`)
            await this.convertAudioFile(newPath, outputFilePath)
          }

          const duration = await this.getAudioDuration(ext === '.awb' ? outputFilePath : newPath)
          totalMinutes += duration

          updatedPath = ext === '.awb' ? outputFilePath : newPath
        }

        const s3Result = await uploadFileToS3({
          filename: newFullFileName,
          filepath: updatedPath,
          contenType: contentType
        })

        if (fs.existsSync(updatedPath)) {
          fs.unlinkSync(updatedPath)
        }
        if (fs.existsSync(newPath)) {
          fs.unlinkSync(newPath)
        }

        console.log(s3Result, newFullFileName)

        return {
          name: file.originalFilename as string,
          url: ((s3Result as CompleteMultipartUploadCommandOutput).Location as string).includes('https')
            ? (s3Result as CompleteMultipartUploadCommandOutput).Location
            : `https://${process.env.AWS_BUCKET_NAME}/${newFullFileName}`,
          minutes: totalMinutes
        }
      })
    )

    return results
  }

  convertAudioFile(inputFilePath: string, outputFilePath: string) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .setFfmpegPath(ffmpegPath as string)
        .setFfprobePath(ffprobeStatic.path)
        .toFormat('mp3')
        .on('end', () => {
          resolve(outputFilePath)
        })
        .on('error', (err) => {
          reject(err)
        })
        .save(outputFilePath)
    })
  }

  getAudioDuration(inputFilePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.setFfprobePath(ffprobeStatic.path)
      ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          const duration = metadata.format.duration || 0
          resolve(duration)
        }
      })
    })
  }

  async UploadImage(req: Request) {
    const file = await handleUploadImage(req)
    const results: any[] = await Promise.all(
      file.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFileName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await uploadFileToS3({
          filename: newFullFileName,
          filepath: newPath,
          contenType: 'image/jpeg/jfif/jp2/jpx/pjpeg/png/webp/'
        })
        await Promise.all([fs.unlinkSync(newPath), fs.unlinkSync(file.filepath)])
        return {
          name: file.originalFilename as string,
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string
        }
      })
    )
    return results
  }
}

const mediasService = new MediasService()
export default mediasService

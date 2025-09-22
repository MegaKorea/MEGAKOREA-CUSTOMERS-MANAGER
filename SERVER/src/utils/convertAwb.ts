import ffmpeg from 'fluent-ffmpeg'

import ffmpegPath from 'ffmpeg-static'
export const convertAudioFile = (inputFilePath: any, outputFilePath: any) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .setFfmpegPath(ffmpegPath as string)
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

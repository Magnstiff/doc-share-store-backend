import config from '../config'
import path from 'path'
import fs, { readdirSync } from 'fs'
import { Application, Request, Response } from 'express'
import { sizeToString } from '../common/fileUtils'

/**
 * 获取文件夹信息
 * @param req
 * @param res
 */
export function getFiles(req: Request, res: Response) {
  if (!req.query.filePath) {
    res.send('filePath is required')
    return
  }

  let filePath: string = req.query.filePath.toString()
  let files: FileInfomation[] = []
  try {
    filePath = path.join(config.filePath, filePath)
    files = readdirSync(filePath).map((filename) => {
      const fileDir = path.join(filePath, filename)
      const stats = fs.statSync(fileDir)
      let size = stats.size
      return {
        fileName: {
          name: filename,
          isFolder: stats.isDirectory(),
        },
        fileSize: stats.isDirectory() ? '-' : sizeToString(size),
      }
    })
  } catch (e) {
    files = []
    console.log(e)
  }
  res.send(files)
}

/**
 * 下载文件
 * @param req
 * @param res
 */
export function downloadFile(req: Request, res: Response) {
  const downloadFilePath = path.join(config.filePath, req.body.filePath)
  res.download(downloadFilePath)
}

/**
 * 预览文件
 * @param req
 * @param res
 */
export function previewFile(req: Request, res: Response) {
  const filePath: string = path.join(config.filePath, req.query.filePath.toString())
  let readStream = undefined
  if (req.headers.range) {
    const fileSize: number = fs.statSync(filePath).size
    const range: string[] = req.headers.range.replace(/bytes=/, '').split('-')
    const startByte: number = Number(range[0])
    const endByte: number = range[1] ? Number(range[1]) : fileSize - 1
    const chunkSize: number = endByte - startByte + 1
    readStream = fs.createReadStream(filePath, { start: startByte, end: endByte })
    res.writeHead(206, {
      'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    })
  } else {
    readStream = fs.createReadStream(filePath)
  }
  readStream.pipe(res)
}

declare global {
  interface FileInfomation {
    fileName: {
      name: string
      isFolder: boolean
    }
    fileSize: string
  }
}

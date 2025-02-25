import config from '../config'
import path from 'path'
import fs, { readdirSync } from 'fs'
import { Request, Response } from 'express'
import { sizeToString } from '../common/file'
import { fileLogger } from '../common/logger'

function checkFilePath(req: Request): {
  exist: boolean
  isDir: boolean
  errorInfo: string
  filePath: string
} {
  let exist = false
  let isDir = false
  let errorInfo = ''
  let filePath = ''
  if (!req.query.filePath) {
    errorInfo = 'filePath is required'
  } else {
    exist = true
    filePath = path.join(config.filePath, req.query.filePath.toString())
    if (!fs.existsSync(filePath)) {
      errorInfo = 'file not exists'
    } else if (fs.statSync(filePath).isDirectory()) {
      isDir = true
      errorInfo = 'file is a folder'
    }
  }
  return { exist, isDir, errorInfo, filePath }
}

/**
 * 获取文件夹信息
 * @param req
 * @param res
 */
export function getFiles(req: Request, res: Response) {
  // check if the filePath parameter is missing
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || !isDir) res.send(errorInfo)
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[${ip}] Get file list: ${req.query.filePath}`)
  // find the file path
  let files: FileInfomation[] = readdirSync(filePath).map((filename) => {
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
  res.send(files)
}

/**
 * 下载文件
 * @param req
 * @param res
 */
export function downloadFile(req: Request, res: Response) {
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || isDir) res.send(errorInfo)
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[${ip}] Download file: ${req.query.filePath}`)
  // downlaod
  res.download(filePath)
}

/**
 * 预览文件
 * @param req
 * @param res
 */
export function previewFile(req: Request, res: Response) {
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || isDir) res.send(errorInfo)
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[${ip}] Preview file: ${req.query.filePath}`)
  // get the file extension
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

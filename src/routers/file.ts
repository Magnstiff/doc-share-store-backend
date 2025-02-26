import config from '../../nasConfig'
import path from 'path'
import fs, { readdirSync } from 'fs'
import { Request, Response } from 'express'
import { sizeToString } from '../common/file'
import { fileLogger } from '../common/logger'
import { FileInfomation } from '../types'
import Busboy from 'busboy'

/**
 * check if the file path is valid
 * @param req request
 * @returns {exist, isDir, errorInfo, filePath}
 */
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
  if (!exist || !isDir) {
    res.send(errorInfo)
    return
  }
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[web][${ip}] Get file list: ${req.query.filePath}`)
  // find the file path
  let files: FileInfomation[] = readdirSync(filePath).map((filename) => {
    const fileDir = path.join(filePath, filename)
    const stats = fs.statSync(fileDir)
    let size = stats.size
    return {
      fileName: filename,
      isFolder: stats.isDirectory(),
      fileSize: stats.isDirectory() ? '-' : sizeToString(size),
      filePath: path.join(req.query.filePath.toString(), filename),
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
  if (!exist || isDir) {
    res.send(errorInfo)
    return
  }
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[web][${ip}] Download file: ${req.query.filePath}`)
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
  if (!exist || isDir) {
    res.send(errorInfo)
    return
  }
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[web][${ip}] Preview file: ${req.query.filePath}`)
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

/**
 * File information
 * @param req
 * @param res
 */
export function search(req: Request, res: Response) {
  if (!req.query.name) {
    res.send('name is required')
    return
  }
  const searchName: string = req.query.name.toString()
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[web][${ip}] Search file: ${searchName}`)
  // search
  const result: FileInfomation[] = []
  const bufferQueue: Array<string> = new Array<string>()
  bufferQueue.push(config.filePath)
  // queue search
  while (bufferQueue.length > 0) {
    const currentPath: string = bufferQueue.shift()
    if (!currentPath) continue
    const isDir: boolean = fs.statSync(currentPath).isDirectory()
    if (isDir) {
      readdirSync(currentPath).forEach((filename: string) => {
        bufferQueue.push(path.join(currentPath, filename))
      })
    }
    const basename: string = path.basename(currentPath)
    if (basename.includes(searchName)) {
      result.push({
        fileName: basename,
        isFolder: isDir,
        fileSize: isDir ? '-' : fs.statSync(currentPath).size.toString(),
        filePath: path.relative(config.filePath, currentPath),
      })
    }
  }
  res.send(result)
}

/**
 * Upload file
 * @param req
 * @param res
 */
export function uploadFile(req: Request, res: Response) {
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[web][${ip}] Upload file`)
  // upload
  const busboy = Busboy({ headers: req.headers })
  busboy.on('file', function (filename: string, file, info) {
    const saveTo = path.join(config.filePath, filename)
    file.pipe(fs.createWriteStream(saveTo))
  })
  busboy.on('finish', function () {
    res.send('upload success')
  })
  req.pipe(busboy)
}

import config from '../../nasConfig'
import path from 'path'
import fs, { readdirSync } from 'fs'
import { Request, Response } from 'express'
import { sizeToString, checkFilePath } from '../common/file'
import { fileLogger } from '../common/logger'
import { FileInfomation } from '../types'
import Busboy from 'busboy'
import db from '../common/database'
import { v4 as uuidv4 } from 'uuid';

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
      encrypt: undefined,
    }
  })
  // check if the file is encrypted
  Promise.all(
    files.map(async (file) => {
      file.encrypt = await db.checkEncryptFile(path.join(config.filePath, file.filePath))
      return file
    }),
  ).then((files) => {
    res.send(files)
  })
}

/**
 * 下载文件
 * @param req
 * @param res
 */
export async function downloadFile(req: Request, res: Response) {
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || isDir) {
    res.send(errorInfo)
    return
  }
  // check password
  const password = req.query.password?.toString()
  if ((await db.checkEncryptFile(filePath)) && !(await db.checkPassword(filePath, password))) {
    res.send('password error')
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
export async function previewFile(req: Request, res: Response) {
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || isDir) {
    res.send(errorInfo)
    return
  }
  // check password
  const password = req.query.password?.toString()
  if ((await db.checkEncryptFile(filePath)) && !(await db.checkPassword(filePath, password))) {
    res.send('password error')
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
        encrypt: undefined,
      })
    }
  }
  // check if the file is encrypted
  Promise.all(
    result.map(async (file) => {
      file.encrypt = await db.checkEncryptFile(path.join(config.filePath, file.filePath))
      return file
    }),
  ).then((result) => {
    res.send(result)
  })
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
    const saveTo = path.join(config.filePath, req.query.path.toString())
    file.pipe(fs.createWriteStream(saveTo))
  })
  busboy.on('finish', function () {
    res.send('upload success')
  })
  req.pipe(busboy)
}

/**
 * Encrypt file
 * @param req
 * @param res
 */
export async function encryptFile(req: Request, res: Response) {
  // check if the filePath parameter is missing
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist) {
    res.send(errorInfo)
    return
  }
  const encrypted = await db.checkEncryptFile(filePath)
  // log
  const ip = req.headers['x-forwarded-for'] || req.ip
  fileLogger.info(`[web][${ip}] ${encrypted ? 'decrypt' : 'encrypt'} file: ${req.query.filePath}`)
  // write into database
  if (encrypted) {
    db.removeEncryptFile(filePath, req.query.password.toString())
      .then(() => {
        res.send('解密成功')
      })
      .catch((err) => {
        res.send(err)
      })
  } else {
    db.addEncryptFile(filePath, req.query.password.toString())
    res.send('加密成功')
  }
}

/**
 * add backup to database
 * @param req 
 * @param res 
 */
export async function createBackup(req: Request, res: Response) {
  // check if the filePath parameter is missing
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || isDir) {
    res.send(errorInfo)
    return
  }
  const backupName:string = uuidv4();
  db.createBackup(filePath, backupName);
  // 复制文件到备份文件夹
  fs.cpSync(filePath, path.join(config.backupPath, backupName), { recursive: true });
  res.send('备份成功');
}

/**
 * get backup list
 * @param req 
 * @param res 
 */
export async function getBackupList(req: Request, res: Response) {
  const { exist, isDir, errorInfo, filePath } = checkFilePath(req)
  if (!exist || isDir) {
    res.send(errorInfo)
    return
  }
  db.getBackupList(filePath).then((backupList: Array<string>) => {
    res.send(backupList);
  }).catch((err) => {
    res.send(err);
  })
}

/**
 * backup file
 * @param request 
 * @param response 
 */
export async function backupFile(request: Request, response: Response) {
  const { exist, isDir, errorInfo, filePath } = checkFilePath(request)
  if (!exist || isDir) {
    response.send(errorInfo)
    return
  }
  const backupUUID = request.query.backupUUID.toString()
  const backupFilePath = path.join(config.backupPath, backupUUID);
  // 新建旧的备份
  const backupName:string = uuidv4();
  db.createBackup(filePath, backupName);
  fs.cpSync(filePath, backupFilePath, { recursive: true });
  // 删除需求备份
  db.deleteBackup(backupUUID);
  // 恢复需求备份
  fs.rmSync(filePath, { recursive: true });
  fs.cpSync(backupFilePath, filePath, { recursive: true });
  fs.rmSync(backupFilePath, { recursive: true });
  response.send('恢复成功');
}


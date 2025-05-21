import  { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import config from '../../nasConfig'

/**
 * 将文件大小转换为字符串
 * @param size 文件大小
 * @returns 文件大小字符串
 */
export function sizeToString(size: number): string {
  let index = 0
  const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  while (size > 1024 && index < unit.length) {
    size /= 1024
    index++
  }
  return size.toFixed(1) + unit[index]
}

/**
 * check if the file path is valid
 * @param req request
 * @returns {exist, isDir, errorInfo, filePath} 文件是否存在，是否是文件夹，错误信息，文件路径
 */
export function checkFilePath(req: Request): {
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

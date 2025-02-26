import config from '../config'
import path from 'path'
import fs, { readdirSync, readFileSync } from 'fs'
import { Request, Response } from 'express'
import { FileInfomation } from './RouterType'

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
  const searchName = req.query.name.toString()
  // search
  const result: FileInfomation[] = []
  const bufferQueue = new Array<string>()
  bufferQueue.push(config.filePath)
  // queue search
  while (bufferQueue.length > 0) {
    const currentPath = bufferQueue.shift()
    if (!currentPath) continue
    const isDir = fs.statSync(currentPath).isDirectory()
    if (isDir) {
      readdirSync(currentPath).forEach((filename) => {
        bufferQueue.push(path.join(currentPath, filename))
      })
    }
    const basename = path.basename(currentPath)
    if (basename.includes(searchName)) {
      result.push({
        fileName: {
          name: basename,
          isFolder: isDir,
        },
        fileSize: isDir ? '-' : fs.statSync(currentPath).size.toString(),
        filePath: path.relative(config.filePath, currentPath),
      })
    }
  }
  res.send(result)
}

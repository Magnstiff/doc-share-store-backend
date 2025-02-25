import { checkPath } from '../../public/index.js'
import config from '../../config/index.js'
import path from 'path'
import fs, { readdirSync } from 'fs'

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径,相对于config.json中的filePath
 */
function fileDisplay (filePath) {
  try {
    if (!checkPath(filePath)) return []
    filePath = path.join(config.filePath, filePath)
    const files = []
    readdirSync(filePath).forEach(filename => {
      const fileDir = path.join(filePath, filename)
      const stats = fs.statSync(fileDir)
      let size = stats.size
      let index = 0
      const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
      while (size > 1024) {
        size /= 1024
        index++
      }
      files[files.length] = {
        fileName: {
          name: filename,
          isFolder: stats.isDirectory()
        },
        fileSize: stats.isDirectory() ? '-' : size.toFixed(1) + unit[index]
      }
    })
    return files
  } catch (e) {
    console.log(e)
    return []
  }
}

export default function (app) {
  app.get('/file', (req, res) => {
    res.send(fileDisplay(req.query.filePath))
  })
}

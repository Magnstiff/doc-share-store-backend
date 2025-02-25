import { checkPath } from '../../public/index.js'
import config from '../../config/index.js'
import path from 'path'

/**
 * 下载文件
 * @param req
 * @param res
 */
function download (req, res) {
  const downloadFilePath = path.join(config.filePath, req.body.filePath)
  if (!checkPath(downloadFilePath)) return null
  res.download(downloadFilePath)
}

export default function (app) {
  app.post('/download', (req, res) => {
    download(req, res)
  })
}

import { checkPath } from '../../public/index.js'
import config from '../../config/index.js'
import path from 'path'
import fs from 'fs'

function preview (filePath, req, res) {
  if (!checkPath(filePath)) return []
  filePath = path.join(config.filePath, filePath)
  let readStream
  if (req.headers.range) {
    const fileSize = fs.statSync(filePath).size
    const range = req.headers.range.replace(/bytes=/, '').split('-')
    const startByte = Number(range[0])
    const endByte = range[1] ? Number(range[1]) : fileSize - 1
    const chunkSize = (endByte - startByte) + 1
    readStream = fs.createReadStream(filePath, { start: startByte, end: endByte })
    res.writeHead(206, {
      'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4'
    })
  } else {
    readStream = fs.createReadStream(filePath)
  }
  readStream.pipe(res)
}

export default function (app) {
  app.get('/preview', (req, res) => {
    preview(req.query.filePath, req, res)
  })
}

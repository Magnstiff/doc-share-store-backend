import bodyParser from 'body-parser'
import routers from './routers'
import { Application } from 'express'
import express from 'express'
import fs from 'fs'
import config from '../nasConfig'
import { systemLogger } from './common/logger'
import { getSystemInfo } from './common/system'
import { FtpSrv } from 'ftp-srv'
import { fileLogger } from './common/logger'
import { getDatabase, createBackup } from './common/database'

// server for http
class HttpServer {
  private app: Application
  constructor() {
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: false }))
    routers(this.app)
    this.ltService()
  }
  ltService() {
    createBackup(getDatabase(), '123', '1234')

    getDatabase().all('SELECT * FROM backups', [], (err, rows) => {
      if (err) {
        throw err
      }
      rows.forEach((row) => {
        console.log(row)
      })
    })

    setInterval(async () => {
      systemLogger.info(await getSystemInfo())
    }, 10000)
  }
  start() {
    this.app.listen(config.httpPort)
    console.log(`Server is running on http://localhost:${config.httpPort}`)
  }
}

// server for ftp
class FtpServer {
  private ftpServer: FtpSrv
  constructor() {
    this.ftpServer = new FtpSrv({
      url: `ftp://0.0.0.0:${config.ftpPort}`,
      anonymous: false,
      pasv_min: 5054,
      pasv_max: 5055,
    })
    this.ftpServer.on('login', ({ username, password }, resolve, reject) => {
      if (username !== 'admin' || password !== 'admin') {
        return reject(new Error('Unauthorized'))
      }
      resolve({ root: config.filePath })
      fileLogger.info(`[ftp][${username}] login`)
    })
  }
  start() {
    this.ftpServer.listen()
    console.log(`FTP Server is running on ftp://localhost:${config.ftpPort}`)
  }
}

new HttpServer().start()
new FtpServer().start()

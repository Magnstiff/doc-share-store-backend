import bodyParser from 'body-parser'
import routers from './routers'
import { Application } from 'express'
import express from 'express'
import config from './config'
import { systemLogger } from './common/logger'
import { getSystemInfo } from './common/system'
import { FtpSrv } from 'ftp-srv'

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
    setInterval(async () => {
      systemLogger.info(await getSystemInfo())
    }, 10000)
  }
  start() {
    this.app.listen(config.httpPort)
    console.log(`Server is running on http://localhost:${config.httpPort}`)
  }
}

class FtpServer {
  private ftpServer: FtpSrv
  constructor() {
    this.ftpServer = new FtpSrv({
      url: `ftp://0.0.0.0:${config.ftpPort}`,
      anonymous: true,
      pasv_min: 5054,
      pasv_max: 5055,
    })
    this.ftpServer.on('login', ({ username, password }, resolve, reject) => {
      console.log(username, password)
      if (username === 'admin' && password === 'password') {
        resolve({ root: config.filePath })
      } else {
        reject(new Error('Bad username or password'))
      }
    })
  }
  start() {
    this.ftpServer.listen()
    console.log(`FTP Server is running on ftp://localhost:${config.ftpPort}`)
  }
}

new HttpServer().start()
new FtpServer().start()

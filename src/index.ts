import bodyParser from 'body-parser'
import routers from './routers'
import { Application } from 'express'
import express from 'express'
import config from '../nasConfig'
import { systemLogger } from './common/logger'
import { getSystemInfo } from './common/system'
import { FtpSrv } from 'ftp-srv'
import { fileLogger } from './common/logger'
import { Git } from 'node-git-server'
import path from 'path'

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
    setInterval(async () => {
      systemLogger.info(await getSystemInfo())
    }, 10000)
  }
  start() {
    this.app.listen(config.httpPort)
    console.log(`HTTP Server is running on http://localhost:${config.httpPort}`)
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

// server for git
class gitServer {
  private repos: Git
  constructor() {
    this.repos = new Git(config.filePath, {
      autoCreate: true,
    })
    this.repos.on('push', (push) => {
      console.log(`push ${push.repo}/${push.commit} ( ${push.branch} )`)
      push.accept()
    })
    this.repos.on('fetch', (fetch) => {
      console.log(`fetch ${fetch.commit}`)
      fetch.accept()
    })
  }
  start() {
    this.repos.listen(config.gitPort)
    console.log(`Git Server is running on git://localhost:${config.gitPort}`)
  }
}

new HttpServer().start()
new FtpServer().start()
new gitServer().start()

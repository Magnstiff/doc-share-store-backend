import bodyParser from 'body-parser'
import routers from './routers'
import { Application } from 'express'
import express from 'express'
import config from './config'
import { systemLogger } from './common/logger'
import { getSystemInfo } from './common/system'

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
    this.app.listen(config.port)
    console.log(`Server is running on http://localhost:${config.port}`)
  }
}

const server = new HttpServer()
server.start()

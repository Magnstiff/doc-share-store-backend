import bodyParser from 'body-parser'
import routers from './routers'
import { Application } from 'express'
import express from 'express'
import config from './config'

const app: Application = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

routers(app)

app.listen(config.port)
console.log(`Server is running on http://localhost:${config.port}`)

import express from 'express'
import fileRouter from './routers/file/index.js'
import downloadRouter from './routers/download/index.js'
import previewRouter from './routers/preview/index.js'
import bodyParser from 'body-parser'
import config from "./config/index.js";

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.use(express.static('files'))

fileRouter(app)
downloadRouter(app)
previewRouter(app)

app.listen(config.port)

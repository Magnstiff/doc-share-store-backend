import pino from 'pino'
import path from 'path'
import fs from 'fs'

const loggerDes = {
  fileLogger: './logs/file.log',
  systemLogger: './logs/system.log',
}

// Create log directory
for (const key in loggerDes) {
  const logDir = path.dirname(loggerDes[key])
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

// Logger for file system
export const fileLogger = pino({
  transport: {
    target: 'pino/file',
    options: {
      destination: loggerDes.fileLogger,
    },
  },
  base: null,
})

//logger for operating system
export const systemLogger = pino({
  transport: {
    target: 'pino/file',
    options: {
      destination: loggerDes.systemLogger,
    },
  },
  base: null,
  timestamp: false,
})

import { Application, Response, Request } from 'express'
import { getFiles, downloadFile, previewFile } from './file'

const registRouter: {
  [key: string]: { handle: Function; method: 'get' | 'post' | 'delete' | 'put' }
} = {
  '/file': { handle: getFiles, method: 'get' },
  '/download': { handle: downloadFile, method: 'get' },
  '/preview': { handle: previewFile, method: 'get' },
}

export default function (app: Application) {
  for (const router in registRouter) {
    const config = registRouter[router]
    app[config.method](router, (req: Request, res: Response) => config.handle(req, res))
  }
}

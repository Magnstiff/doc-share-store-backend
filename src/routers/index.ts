import { Application, Response, Request } from 'express'
import { getFiles, downloadFile, previewFile, search, uploadFile } from './file'
import { getSysInfo } from './system'

// router registration
// for example, the '/file' route is registered to the getFiles function
const registRouter: {
  [key: string]: {
    handle: (req: Request, res: Response) => void
    method: 'get' | 'post' | 'delete' | 'put'
  }
} = {
  '/file': { handle: getFiles, method: 'get' },
  '/download': { handle: downloadFile, method: 'get' },
  '/preview': { handle: previewFile, method: 'get' },
  '/search': { handle: search, method: 'get' },
  '/upload': { handle: uploadFile, method: 'post' },
  '/systemInfo': { handle: getSysInfo, method: 'get' },
}

// regist routers
export default function (app: Application) {
  for (const router in registRouter) {
    const config = registRouter[router]
    app[config.method](router, (req: Request, res: Response) => config.handle(req, res))
  }
}

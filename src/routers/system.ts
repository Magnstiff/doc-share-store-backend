import { Request, Response } from 'express'
import { getSystemInfo } from '../common/system'

export async function getSysInfo(req: Request, res: Response) {
  res.send(await getSystemInfo())
}

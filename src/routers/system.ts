import { Request, Response } from 'express'
import { getSystemInfo } from '../common/system'

/**
 * get system information, format see src/common/system.ts
 * @param req
 * @param res
 */
export async function getSysInfo(req: Request, res: Response) {
  res.send(await getSystemInfo())
}

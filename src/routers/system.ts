import { Request, Response } from 'express'
import si, { battery, mem } from 'systeminformation'
import { sizeToString } from '../common/fileUtils'

export async function getSysteInfo(req: Request, res: Response) {
  const memTotal = (await mem()).total
  const memUsed = (await mem()).used
  const diskTotal = (await si.fsSize())[0].size
  const diskUsed = (await si.fsSize())[0].used

  const info = {
    time: si.time().current,
    static: {
      pc: (await si.system()).model,
      cpu: (await si.cpu()).brand,
      os: (await si.osInfo()).distro,
    },
    realtime: {
      temperature: (await si.cpuTemperature()).main + '℃',
      battery: (await battery()).percent + '%',
      cpu: (await si.currentLoad()).currentLoad.toFixed(1) + '%',
      memory: `${memUsed}/${memTotal}(${((memUsed / memTotal) * 100).toFixed(1)}%)`,
      disk: `${sizeToString(diskUsed)}/${sizeToString(diskTotal)}(${((diskUsed / diskTotal) * 100).toFixed(1)}%)`,
    },
  }

  res.send(info)
}

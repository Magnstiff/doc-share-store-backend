import si, { battery, mem } from 'systeminformation'
import { sizeToString } from '../common/file'
import dayjs from 'dayjs'

/**
 * Get system information
 * @returns System information
 */
export async function getSystemInfo(): Promise<{
  time: string
  static: {
    pc: string
    cpu: string
    os: string
  }
  realtime: {
    temperature: string
    battery: string
    cpu: string
    memory: string
    disk: string
  }
}> {
  const memTotal: number = (await mem()).total
  const memUsed: number = (await mem()).used
  const diskTotal: number = (await si.fsSize())[0].size
  const diskUsed: number = (await si.fsSize())[0].used
  const info = {
    time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    static: {
      pc: (await si.system()).model,
      cpu: (await si.cpu()).brand,
      os: (await si.osInfo()).distro,
    },
    realtime: {
      temperature: (await si.cpuTemperature()).main + '℃',
      battery: (await battery()).percent + '%',
      cpu: (await si.currentLoad()).currentLoad.toFixed(1) + '%',
      memory: `${sizeToString(memUsed)}/${sizeToString(memTotal)}(${((memUsed / memTotal) * 100).toFixed(1)}%)`,
      disk: `${sizeToString(diskUsed)}/${sizeToString(diskTotal)}(${((diskUsed / diskTotal) * 100).toFixed(1)}%)`,
    },
  }
  return info
}

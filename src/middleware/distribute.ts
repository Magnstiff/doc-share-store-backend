import config from '../../nasConfig'
import axios from 'axios'

/**
 * 检查网络是否可用
 */
export async function checkdistributeNetwork() {
  for (const net of config.net) {
    try {
      const res = await axios.post(`${net}/file`)
    } catch (e) {
      throw new Error('网络不可用:' + net)
    }
  }
}

/**
 * distribute file to other network
 * @param doF
 */
export async function distributeDo(doF: (net: string) => Promise<any>) {
  // 检查网络
  try {
    await checkdistributeNetwork()
  } catch (e) {
    console.log(e)
    return
  }

  const resList = []
  for (const net of config.net) {
    try {
      const result = await doF(net)
      resList.push(result)
    } catch (e) {
      console.log(`Error processing network ${net}:`, e)
    }
  }
  return resList
}

/**
 * 分布式获取文件列表
 */
export async function distributeGetFiles() {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/file`)
    return res.data
  })
}

/**
 * 分布式下载文件
 */
export async function distributeDownloadFile(filePath: string, password?: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/download`, {
      params: { filePath, password },
      responseType: 'stream',
    })
    return res.data
  })
}

/**
 * 分布式预览文件
 */
export async function distributePreviewFile(filePath: string, password?: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/preview`, {
      params: { filePath, password },
    })
    return res.data
  })
}

/**
 * 分布式搜索文件
 */
export async function distributeSearchFile(name: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/search`, {
      params: { name },
    })
    return res.data
  })
}

/**
 * 分布式上传文件
 */
export async function distributeUploadFile(file: any, path: string) {
  return distributeDo(async (net) => {
    const formData = new FormData()
    formData.append('file', file, path)
    const res = await axios.post(`${net}/upload`, formData, {})
    return res.data
  })
}

/**
 * 分布式加密/解密文件
 */
export async function distributeEncryptFile(filePath: string, password: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/encrypt`, {
      params: { filePath, password },
    })
    return res.data
  })
}

/**
 * 分布式创建备份
 */
export async function distributeCreateBackup(filePath: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/createBackup`, {
      params: { filePath },
    })
    return res.data
  })
}

/**
 * 分布式获取备份列表
 */
export async function distributeGetBackupList(filePath: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/getBackupList`, {
      params: { filePath },
    })
    return res.data
  })
}

/**
 * 分布式恢复备份
 */
export async function distributeBackupFile(filePath: string, backupUUID: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/backupFile`, {
      params: { filePath, backupUUID },
    })
    return res.data
  })
}

/**
 * 分布式删除备份
 */
export async function distributeDeleteBackup(filePath: string, backupUUID: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/deleteBackup`, {
      params: { filePath, backupUUID },
    })
    return res.data
  })
}

/**
 * 分布式删除文件
 */
export async function distributeDeleteFile(filePath: string, password?: string) {
  return distributeDo(async (net) => {
    const res = await axios.get(`${net}/deleteFile`, {
      params: { filePath, password },
    })
    return res.data
  })
}

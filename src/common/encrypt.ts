import crypto from 'crypto'
import fs from 'fs'

const algorithm = 'aes-256-cbc'

/**
 * 通过用户输入的密码生成 32 字节（256-bit）密钥
 * @param password 用户输入的密码
 * @returns 32 字节密钥
 */
function deriveKeyFromPassword(password: string): Buffer {
  return crypto.createHash('sha256').update(password).digest()
}

/**
 * 文件加密
 * @param inputFile 输入文件路径
 * @param outputFile 输出文件路径
 * @param password 用户输入的密码
 */
function encryptFile(inputFile: string, outputFile: string, password: string) {
  const key = deriveKeyFromPassword(password)
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const input = fs.createReadStream(inputFile)
  const output = fs.createWriteStream(outputFile)

  output.write(iv)
  input.pipe(cipher).pipe(output)
}

/**
 * 文件解密
 * @param inputFile 输入文件路径
 * @param outputFile 输出文件路径
 * @param password 用户输入的密码
 */
function decryptFile(inputFile: string, outputFile: string, password: string) {
  const key = deriveKeyFromPassword(password)
  const input = fs.createReadStream(inputFile)
  const output = fs.createWriteStream(outputFile)

  const iv = Buffer.alloc(16)
  input.read(iv.length)

  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  input.pipe(decipher).pipe(output)
}

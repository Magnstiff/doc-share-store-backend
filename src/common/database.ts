import sqlite3 from 'sqlite3'
import fs from 'fs'

class DataBaseLite {
  private db: sqlite3.Database
  constructor() {
    this.db = this.getDatabase()
  }

  /**
   * 获取数据库实例
   * @returns 数据库实例
   */
  getDatabase(): sqlite3.Database {
    // 判断数据库是否存在
    if (!fs.existsSync('./db')) fs.mkdirSync('./db')
    if (fs.existsSync('./db/file_info.db')) return new sqlite3.Database('./db/file_info.db')
    // 创建数据库
    const database = new sqlite3.Database('./db/file_info.db')
    database.run(
      `CREATE TABLE backups (path VARCHAR(500), backup_path VARCHAR(128), time DATETIME)`,
    )
    database.run('CREATE TABLE encrypt_files (path VARCHAR(500), password VARCHAR(128))')
    return database
  }

  /**
   * 创建备份
   * @param path 源文件路径
   * @param backupPath 备份文件路径
   */
  createBackup(path: string, backupPath: string): void {
    this.db.serialize(() => {
      // 添加backups
      this.db.run('INSERT INTO backups (path, backup_path, time) VALUES (?, ?, ?)', [
        path,
        backupPath,
        new Date().toISOString(),
      ])
    })
  }

  /**
   * 删除备份
   * @param database 数据库实例
   * @param backupUUID 备份文件uuid
   */
  deleteBackup(backupUUID: string): void {
    this.db.serialize(() => {
      this.db.run('DELETE FROM backups WHERE backup_path = ?', [backupUUID])
    })
  }

  /**
   * 获取备份列表
   * @param path 源文件路径
   * @returns 备份列表
   */
  getBackupList(path: string): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT backup_path FROM backups WHERE path = ?',
        [path],
        (err, rows: Array<string>) => {
          if (err) reject(err)
          resolve(rows.map((row) => row))
        },
      )
    })
  }

  /**
   * 记录加密文件
   * @param path 被加密文件路径
   */
  addEncryptFile(path: string, password: string): void {
    const database = this.db
    database.serialize(() => {
      database.run('INSERT INTO encrypt_files (path, password) VALUES (?, ?)', [path, password])
    })
  }

  /**
   * 检查文件是否被加密
   * @param path 被加密文件路径
   * @returns
   * - true: 被加密
   * - false: 未被加密
   */
  checkEncryptFile(path: string): Promise<boolean> {
    const database = this.db
    return new Promise((resolve, reject) => {
      database.all('SELECT path FROM encrypt_files WHERE path = ?', [path], (err, rows) => {
        if (err) reject(err)
        resolve(rows.length !== 0)
      })
    })
  }

  /**
   * 检查密码是否正确
   * @param path 被加密文件路径
   * @param password 密码
   * @returns
   */
  checkPassword(path: string, password: string): Promise<boolean> {
    const database = this.db
    return new Promise((resolve, reject) => {
      database.all(
        'SELECT path FROM encrypt_files WHERE path = ? AND password = ?',
        [path, password],
        (err, rows) => {
          if (err) reject(err)
          resolve(rows.length !== 0)
        },
      )
    })
  }

  /**
   * 删除加密文件
   * @param path 被加密文件路径
   */
  async removeEncryptFile(path: string, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const isPassword = await this.checkPassword(path, password)
      if (!isPassword) reject('密码错误')
      else
        this.db.serialize(() => {
          this.db.run('DELETE FROM encrypt_files WHERE path = ? AND password = ?', [path, password])
        })
      resolve()
    })
  }

  /**
   * 获取所有加密文件
   * @returns
   */
  getEnc() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM encrypt_files', [], (err, rows) => {
        if (err) reject(err)
        resolve(rows)
      })
    })
  }
}

export default new DataBaseLite()

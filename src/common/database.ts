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
      `CREATE TABLE files (id INTEGER PRIMARY KEY AUTOINCREMENT, path VARCHAR(500), time DATETIME)`,
    )
    database.run(
      `CREATE TABLE backups (id REFERENCES files(id), backup_path VARCHAR(128), time DATETIME)`,
    )
    return database
  }

  /**
   * 创建备份
   * @param path 源文件路径
   * @param backupPath 备份文件路径
   */
  createBackup(path: string, backupPath: string): void {
    const database = this.db
    // 查询id
    database.serialize(() => {
      // 创建id
      database.all('SELECT id FROM files WHERE path = ?', [path], (err, rows) => {
        if (err) throw err
        if (rows.length === 0)
          database.run('INSERT INTO files (path, time) VALUES (?, ?)', [
            path,
            new Date().toISOString(),
          ])
      })
      // 添加backups
      database.run(
        'INSERT INTO backups (id, backup_path, time) VALUES ((SELECT id FROM files WHERE path = ?), ?, ?)',
        [path, backupPath, new Date().toISOString()],
      )
    })
  }

  /**
   * 删除备份
   * @param database 数据库实例
   * @param path 源文件路径
   */
  deleteBackup(path: string): void {
    const database = this.db
    database.serialize(() => {
      database.run('DELETE FROM backups WHERE id = (SELECT id FROM files WHERE path = ?)', [path])
    })
  }

  /**
   * 获取备份列表
   * @param path 源文件路径
   * @returns 备份列表
   */
  getBackupList(path: string): Promise<Array<string>> {
    const database = this.db
    return new Promise((resolve, reject) => {
      database.all(
        'SELECT backup_path FROM backups WHERE id = (SELECT id FROM files WHERE path = ?)',
        [path],
        (err, rows: Array<string>) => {
          if (err) reject(err)
          resolve(rows.map((row) => row))
        },
      )
    })
  }
}

export default DataBaseLite

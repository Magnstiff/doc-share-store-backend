/**
 * 检查路径是否会超出config.json中的filePath
 * @param filePath
 */
export function checkPath (filePath) {
  if (!filePath) return false
  filePath.replace(' ', '')
  return !filePath.includes('..')
}

/**
 * 将文件大小转换为字符串
 * @param size 文件大小
 * @returns 文件大小字符串
 */
export function sizeToString(size: number): string {
  let index = 0
  const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  while (size > 1024 && index < unit.length) {
    size /= 1024
    index++
  }
  return size.toFixed(1) + unit[index]
}

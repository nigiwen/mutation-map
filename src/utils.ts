// 根据一个 num 值，将数组分成左右两个区域，左边的值小于等于 num，右边的值大于 num
export function groupValues<T extends { position?: number }>(arr: T[], splitValue: number): [T[], T[]] {
  if (arr.length === 0)
    return [[], []]

  const data = arr.filter((item): item is T & { position: number } => item.position !== undefined)

  // 根据splitValue将数组分成左右两个区域
  const leftRegion = []
  const rightRegion = []

  for (const item of data) {
    if (item.position <= splitValue) {
      leftRegion.push(item)
    }
    else {
      rightRegion.push(item)
    }
  }

  return [leftRegion.sort((a, b) => b.position - a.position), rightRegion]
}

// 计算数组对象中 w 属性的最大连续非零值
export function maxConsecutiveNonZeroW<T extends { w: number }>(arr: T[]) {
  let maxCount = 0
  let currentCount = 0

  arr.forEach((item) => {
    if (item.w !== 0) {
      currentCount++
      if (currentCount > maxCount) {
        maxCount = currentCount
      }
    }
    else {
      currentCount = 0
    }
  })

  return maxCount
}

// 返回数组中从第一个开始非零 w 值的数组数量
export function countFirstNonZeroWSequence<T extends { w: number }>(arr: T[]) {
  if (arr.length === 0 || arr[0].w === 0) {
    return 0 // 数组为空或第一个对象的 w 为 0 时直接返回 0
  }

  let count = 0

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].w === 0) {
      break // 遇到 w 为 0 时停止计数
    }
    count++
  }

  return count
}

// 创建一个从 start 到 end 的数组，步长为 segmentSize
export function createSegments(start: number, end: number, segmentSize: number): number[] {
  const result: number[] = []
  for (let i = start; i <= end; i += segmentSize) {
    result.push(i)
  }
  if (result[result.length - 1] !== end) {
    result.push(end)
  }
  return result
}

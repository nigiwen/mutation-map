import * as d3 from 'd3'

import {
  countFirstNonZeroWSequence,
  createSegments,
  groupValues,
  maxConsecutiveNonZeroW,
} from './utils.js'

class MutationMap<T extends HTMLElement, Data extends { position: number, text: string, isDRM: boolean, isUnusual: boolean }> {
  // 总宽
  #overallWidth = 1720
  // 总体左偏移量
  #overallLeftMargin = 120
  // 总容器
  #rootContainer: T
  // 总 svg 容器
  #svgContainer
  // 总 g 容器
  #gContainer
  // 轴 svg 容器
  #svgAxis
  // 显示游标容器
  #svgView
  // 指定 x 轴点数组
  #tickValues: number[] = []
  // 指定 x 轴的开始结尾
  #domain: [number, number] = [0, 100]
  // 显示板的标题配置
  #textConfig: { text?: string, background?: string, color?: string } = {}
  // 数据
  #data: Data[] = []
  // 用来切分超出显示的游标左右分区
  #interval = 0
  // 总容器盒子宽度
  #viewBoxWidth = 0
  // 左侧游标超出显示的总宽度
  #leftMargin = 0
  // 设置短距
  #shorten: { width?: number, x?: number } = {}
  // 储存 x 轴的比例转换器
  scaleX?: {
    (num: number): number
    invert: (x: number) => number
  }

  constructor(el: T) {
    this.#rootContainer = el

    this.#svgContainer = this.#createSvgContainer()
    this.#gContainer = this.#createGContainer()
    this.#svgAxis = this.#createSvgAxis()
    this.#svgView = this.#createSvgView()
  }

  #createSvgContainer() {
    return d3
      .create('svg')
      .attr('font-family', `"Source Sans Pro", "Helvetica Neue", Helvetica`)
      .style('vertical-align', 'middle')
  }

  #createGContainer() {
    return this.#svgContainer.append('g')
  }

  #createSvgAxis() {
    const svgAxis = this.#gContainer
      .append('svg')
      .attr('y', 20)
      .style('overflow', 'auto')

    return svgAxis
  }

  setDomain(val: [number, number]) {
    this.#domain = val

    return this
  }

  #renderAxis() {
    const svg = this.#svgAxis

    const path = svg.append('path')
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-width', '2')

    const { width, x } = this.#shorten || {}

    if (typeof width === 'number' && typeof x === 'number') {
      path.attr('d', `m ${this.#overallLeftMargin} 18 h ${width} l 5 -5 v 10 l 5 -5 h ${this.#overallWidth - width - 10}`)
    }
    else {
      path.attr('d', `m ${this.#overallLeftMargin} 18 h ${this.#overallWidth}`)
    }

    const [start, end] = this.#domain

    const getX = (num: number) => {
      let ratio

      if (typeof width === 'number' && typeof x === 'number') {
        if (num <= x) {
          ratio = (num - start) / (x - start)
          ratio = ratio * width
        }
        else {
          ratio = (num - x) / (end - x)
          ratio = width + ratio * (this.#overallWidth - width)
        }
      }
      else {
        ratio = (num - start) / (end - start)

        ratio = (ratio * this.#overallWidth)
      }

      return ratio + this.#overallLeftMargin
    }

    getX.invert = (x: number) => {
      const ratio = x / this.#overallWidth
      return start + ratio * (end - start)
    }

    const renderX = (svg: d3.Selection<SVGSVGElement, undefined, null, undefined>, num: number) => {
      const x = getX(num)

      svg.append('text')
        .attr('x', x)
        .attr('y', 12)
        .attr('font-size', '12px')
        .attr('fill', '#1C1B1C')
        .attr('text-anchor', 'middle')
        .text(num)

      svg.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 17)
        .attr('y2', 26)
        .attr('stroke', '#000000')
        .attr('stroke-width', '2')
    }

    if (this.#tickValues.length) {
      this.#tickValues.forEach((num) => {
        renderX(svg, num)
      })
    }
    else {
      createSegments(start, end, 20).forEach((num) => {
        renderX(svg, num)
      })
    }

    this.scaleX = getX
  }

  setShorten(overallWidth: number, width: number, x: number) {
    this.#overallWidth = overallWidth
    this.#shorten = {
      width,
      x,
    }

    return this
  }

  setTickValues(val: number[]) {
    this.#tickValues = val

    return this
  }

  #createSvgView() {
    const svgView = this.#gContainer
      .append('svg')
      .attr('y', 45)
      .style('overflow', 'auto')

    return svgView
  }

  #renderContent() {
    const svg = this.#svgView

    const matrixG = svg.append('g')

    matrixG.append('rect')
      .attr('x', this.#overallLeftMargin)
      .attr('y', 24)
      .attr('width', this.#overallWidth)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('stroke', 'rgb(255, 255, 255)')
      .attr('stroke-opacity', '0.8')
      .attr('stroke-width', '2')
      .style('fill', this.#textConfig?.background || '#1C1B1C')

    matrixG.append('text')
      .attr('x', 128)
      .attr('y', 39)
      .attr('font-size', '16')
      .attr('dominant-baseline', 'central')
      .attr('fill', this.#textConfig?.color || '#FFFFFF')
      .text(this.#textConfig?.text || '')
  }

  setText(text: string, config: { background: string, color: string }) {
    this.#textConfig = {
      text,
      ...config,
    }

    return this
  }

  setData(val: Data[]) {
    this.#data = val

    return this
  }

  setInterval(val: number) {
    this.#interval = val

    return this
  }

  #renderRightMpa() {
    // 渲染
    const render = (xObj: { data: Data, x: number, h: number, w: number, ch: number }[]) => {
      if (!xObj.length)
        return

      const [firstX, ...restX] = xObj

      const svg = this.#svgView
      const cursorG = svg.append('g')

      const cursorStyle: {
        stroke?: string
        strokeWidth?: number
        fontWeight?: number
      } = {}
      if (firstX.data.isUnusual) {
        // 红色
        cursorStyle.stroke = '#e13333'
        cursorStyle.strokeWidth = 1.5
        cursorStyle.fontWeight = 400
      }
      else if (firstX.data.isDRM) {
        // 蓝色
        cursorStyle.stroke = '#1b8ecc'
        cursorStyle.strokeWidth = 3
        cursorStyle.fontWeight = 600
      }
      else {
        // 黑色
        cursorStyle.stroke = '#000000'
        cursorStyle.strokeWidth = 1
        cursorStyle.fontWeight = 400
      }

      const path = cursorG.append('path')
        .attr('stroke', cursorStyle.stroke)
        .attr('fill', 'none')
        .attr('stroke-width', cursorStyle.strokeWidth)

      const text = cursorG.append('text')
        .attr('fill', cursorStyle.stroke)
        .attr('font-weight', cursorStyle.fontWeight)
        .attr('dominant-baseline', 'central')
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial Narrow')
        .attr('font-size', '14px')
        .text(firstX.data.text)

      // 画一个 Y
      const m = `m ${firstX.x} 21`
      const l = `l 4 4`
      const l2 = `l 4 -4`
      const m2 = `m -4 4`
      // 竖线
      const v = `v ${firstX.h}`

      // 不等于 0 就画曲线
      if (firstX.w !== 0) {
        // 左边曲线
        const c = `c 0 5 0 5 5 5`

        // 横线
        const h = `h ${firstX.w}`

        // 右边曲线
        const c2 = `c 5 0 5 0 5 5`

        // 竖线
        const v2 = `v ${firstX.ch}`
        path.attr('d', `${m} ${l} ${l2} ${m2} ${v} ${c} ${h} ${c2} ${v2}`)
        text.attr('transform', `translate(${firstX.x + firstX.w + 4 + 10}, ${firstX.h + firstX.ch + 30 + 10}) rotate(-60)`)
      }
      else {
        path.attr('d', `${m} ${l} ${l2} ${m2} ${v}`)
        text.attr('transform', `translate(${firstX.x + 4}, ${firstX.h + 30}) rotate(-60)`)
      }

      if (restX.length)
        render(restX)
    }

    // 计算偏移度
    const offset = (xData: Data[], prevX: number = 0, prevOffset: number = 0): { data: Data, x: number, w: number }[] => {
      if (!xData.length)
        return []

      if (typeof this.scaleX !== 'function') {
        throw new TypeError('scaleX is not a function')
      }

      const [firstData, ...restX] = xData
      const firstX = this.scaleX(firstData.position) - 4

      // 当前游标偏移度
      let cursorWidth = 0
      // 上一个游标偏移后的 x 点
      let prevLX = (prevX || 0)

      // 存在偏移量
      if (prevOffset) {
        prevOffset += 10

        prevLX += prevOffset

        cursorWidth += prevOffset
      }

      // 位置不够需要偏移
      if ((prevLX !== 0) && (firstX < prevLX || firstX - prevLX <= 10)) {
        cursorWidth = (prevLX - firstX) + 12

        if (cursorWidth < 0) {
          cursorWidth = 0
        }
        else if (cursorWidth < 12) {
          cursorWidth = 12
        }
      }
      // 无需偏移
      else {
        cursorWidth = 0
      }

      // 记录超过总宽的游标
      if (firstX + cursorWidth > this.scaleX(this.#domain[1]) + 4) {
        this.#viewBoxWidth += 24
      }

      const result = [{ x: firstX, w: cursorWidth, data: firstData }]

      if (restX.length) {
        return result.concat(offset(restX, firstX, cursorWidth))
      }

      return result
    }

    return {
      offset,
      render,
    }
  }

  #renderLeftMpa(startV: Data) {
    // 渲染
    const render = (xObj: { data: Data, x: number, h: number, w: number, ch: number }[]) => {
      if (!xObj.length)
        return

      const [firstX, ...restX] = xObj

      const svg = this.#svgView
      const cursorG = svg.append('g')

      const cursorStyle: {
        stroke?: string
        strokeWidth?: number
        fontWeight?: number
      } = {}
      if (firstX.data.isUnusual) {
        // 红色
        cursorStyle.stroke = '#e13333'
        cursorStyle.strokeWidth = 1.5
        cursorStyle.fontWeight = 400
      }
      else if (firstX.data.isDRM) {
        // 蓝色
        cursorStyle.stroke = '#1b8ecc'
        cursorStyle.strokeWidth = 3
        cursorStyle.fontWeight = 600
      }
      else {
        // 黑色
        cursorStyle.stroke = '#000000'
        cursorStyle.strokeWidth = 1
        cursorStyle.fontWeight = 400
      }

      const path = cursorG.append('path')
        .attr('stroke', cursorStyle.stroke)
        .attr('fill', 'none')
        .attr('stroke-width', cursorStyle.strokeWidth)

      const text = cursorG.append('text')
        .attr('fill', cursorStyle.stroke)
        .attr('font-weight', cursorStyle.fontWeight)
        .attr('dominant-baseline', 'central')
        .attr('text-anchor', 'end')
        .attr('font-family', 'Arial Narrow')
        .attr('font-size', '14px')
        .text(firstX.data.text)

      // 画一个 Y
      const m = `m ${firstX.x} 21`
      const l = `l 4 4`
      const l2 = `l 4 -4`
      const m2 = `m -4 4`
      // 竖线
      const v = `v ${firstX.h}`

      // 不等于 0 就画曲线
      if (firstX.w !== 0) {
        // 左边曲线
        const c = `c 0 5 0 5 -5 5`

        // 横线
        const h = `h ${firstX.w}`

        // 右边曲线
        const c2 = `c -5 0 -5 0 -5 5`

        // 竖线
        const v2 = `v ${firstX.ch}`
        path.attr('d', `${m} ${l} ${l2} ${m2} ${v} ${c} ${h} ${c2} ${v2}`)
        text.attr('transform', `translate(${firstX.x + firstX.w + 4 - 10}, ${firstX.h + firstX.ch + 30 + 10}) rotate(-60)`)
      }
      else {
        path.attr('d', `${m} ${l} ${l2} ${m2} ${v}`)
        text.attr('transform', `translate(${firstX.x + 4}, ${firstX.h + 30}) rotate(-60)`)
      }

      if (restX.length)
        render(restX)
    }

    // 计算偏移度
    const offset = (xData: Data[], prevX: number = 0, prevOffset: number = 0): { data: Data, x: number, w: number }[] => {
      if (!xData.length)
        return []

      if (typeof this.scaleX !== 'function') {
        throw new TypeError('scaleX is not a function')
      }

      const [firstData, ...restX] = xData
      const firstX = this.scaleX(firstData.position) - 4

      // 设置开始的 x 点，左边游标是从中心向左渲染
      if (!prevX) {
        prevX = this.scaleX(startV.position) - 4
      }

      // 当前游标偏移度
      let cursorWidth = 0
      // 上一个游标偏移后的 x 点
      let prevLX = (prevX || 0)

      // 存在偏移量
      if (prevOffset) {
        prevOffset -= 10

        prevLX += prevOffset

        cursorWidth += prevOffset
      }

      // 位置不够需要偏移
      if ((prevLX !== 0) && (firstX > prevLX || firstX - prevLX <= 10)) {
        cursorWidth = (prevLX - firstX) - 12

        if (cursorWidth > 0) {
          cursorWidth = 0
        }
        else if (cursorWidth > -12) {
          cursorWidth = -12
        }
      }
      // 无需偏移
      else {
        cursorWidth = 0
      }

      // 记录超过总宽的游标
      if (firstX + cursorWidth < this.scaleX(this.#domain[0]) + 4) {
        this.#viewBoxWidth += 24
        this.#leftMargin += 15
      }

      const result = [{ x: firstX, w: cursorWidth, data: firstData }]

      if (restX.length) {
        return result.concat(offset(restX, firstX, cursorWidth))
      }

      return result
    }

    return {
      offset,
      render,
    }
  }

  #renderCursor() {
    // 计算游标高度
    const height = (xObj: { data: Data, x: number, w: number }[], totalHeight: number): { data: Data, x: number, w: number, h: number, ch: number }[] => {
      if (!xObj.length)
        return []

      let h = 0
      let ch = 0

      const [firstX, ...restX] = xObj

      // 存在偏移量
      if (firstX.w) {
        // *5是因为间隔是5
        h = (countFirstNonZeroWSequence(xObj) * 5)
        ch = totalHeight - h
        h += 40 - 10 // 40 是基础高度
      }
      else {
        // 10 是弯曲的高度
        h = totalHeight + 40
        ch = 0
      }

      const result = [{ ...firstX, h, ch }]

      if (restX.length) {
        return result.concat(height(restX, totalHeight))
      }

      return result
    }

    const [leftD, rightD] = groupValues(this.#data, this.#interval)

    const { offset: getLeftOffset, render: renderLeftMpa } = this.#renderLeftMpa(rightD[0])
    const leftOffset = getLeftOffset(leftD)
    const leftHeight = maxConsecutiveNonZeroW(leftOffset)

    const { offset: getRightOffset, render: renderRightMpa } = this.#renderRightMpa()
    const rightOffset = getRightOffset(rightD)
    const rightHeight = maxConsecutiveNonZeroW(rightOffset)

    const totalHeight = (Math.max(leftHeight, rightHeight) * 5)

    const leftCursor = height(leftOffset, totalHeight)
    const rightCursor = height(rightOffset, totalHeight)

    renderLeftMpa(leftCursor)
    renderRightMpa(rightCursor)

    this.#svgView.attr('x', this.#leftMargin)
    this.#svgAxis.attr('x', this.#leftMargin)
    this.#svgContainer.attr('viewBox', `0 0 ${1960 + this.#viewBoxWidth} ${160 + totalHeight}`)
  }

  render() {
    // 渲染轴
    this.#renderAxis()
    // 渲染内容
    this.#renderContent()
    // 渲染游标
    this.#renderCursor()

    // 挂载
    d3.select(this.#rootContainer).append(() => this.#svgContainer.node())
  }
}

export const createMutationMap = <T extends HTMLElement, Data extends { position: number, text: string, isDRM: boolean, isUnusual: boolean }>(el: T) => new MutationMap<T, Data>(el)

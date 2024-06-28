import { createMutationMap } from 'mutation-map'
import d3json from './d3js.json'
import d3json2 from './d3js2.json'
import d3json3 from './d3js3.json'

function loadJSON() {
  const container = document.querySelector<HTMLDivElement>('#container')
  if (!container)
    return

  createMutationMap(container)
    .setText('Protease', { background: 'rgb(178, 223, 138)', color: 'rgb(51, 160, 44)' })
    .setDomain([1, 99])
    .setTickValues([1, 5, 10, 15, 25, 30, 35, 40, 45, 50, 55, 65, 70, 75, 80, 85, 90, 99])
    .setInterval(50)
    .setData(d3json)
    .render()
}
loadJSON()

function loadJSON2() {
  const container = document.querySelector<HTMLDivElement>('#container2')
  if (!container)
    return

  createMutationMap(container)
    .setText('Reverse transcriptase', { background: '#A6CEE3', color: '#1F7FBC' })
    .setDomain([1, 560])
    .setShorten(1720, 1543, 350)
    .setTickValues([1, 20, 40, 65, 85, 110, 130, 155, 175, 200, 220, 245, 270, 290, 315, 335, 390, 560])
    .setData(d3json2)
    .setInterval(195)
    .render()
}
loadJSON2()

function loadJSON3() {
  const container = document.querySelector<HTMLDivElement>('#container3')
  if (!container)
    return

  createMutationMap(container)
    .setText('Integrase', { background: '#CAB2D6', color: '#825BA9' })
    .setDomain([1, 288])
    .setTickValues([1, 15, 30, 50, 65, 80, 100, 115, 130, 150, 165, 180, 200, 215, 230, 250, 265, 288])
    .setData(d3json3)
    .setInterval(144)
    .render()
}
loadJSON3()

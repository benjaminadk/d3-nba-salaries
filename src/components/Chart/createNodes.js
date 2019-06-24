import * as d3 from 'd3'
import players from '../../data/players'
import constants from '../constants'

const { width, height } = constants

function getPayLevel(x) {
  if (x < 2000000) {
    return 'low'
  } else if (x < 20000000) {
    return 'mid'
  } else {
    return 'high'
  }
}

export default function createNodes() {
  const maxSalary = d3.max(players, d => d.value)

  const radiusScale = d3
    .scalePow()
    .exponent(2.5)
    .range([4, 65])
    .domain([0, maxSalary])

  const myNodes = players.map((el, i) => {
    return {
      id: i + 1,
      radius: radiusScale(el.value),
      value: el.value,
      payLevel: getPayLevel(el.value),
      name: el.name,
      team: el.team,
      salary: el.salary,
      allStar: el.allStar,
      allNba: el.allNba,
      allDef: el.allDef,
      points: el.points,
      vorp: el.vorp,
      x: Math.random() * width,
      y: Math.random() * height
    }
  })

  myNodes.sort((a, b) => b.value - a.value)

  return myNodes
}

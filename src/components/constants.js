const width = 1200
const height = 600
const y = height / 2
const center = { x: width / 2, y }
const twoCenters = {
  1: { x: width / 3, y },
  2: { x: 2 * (width / 3), y }
}
const threeCenters = {
  1: { x: width / 4, y },
  2: { x: width / 2, y },
  3: { x: 3 * (width / 4), y }
}
const fourCenters = {
  1: { x: width / 5, y },
  2: { x: 2 * (width / 5), y },
  3: { x: 3 * (width / 5), y },
  4: { x: 4 * (width / 5), y }
}
const forceStrength = 0.1
const forceDelay = 2000
const velocityDecay = 0.1
const tooltipWidth = 200
const salaryCap = 101860000

export default {
  width,
  height,
  center,
  twoCenters,
  threeCenters,
  fourCenters,
  tooltipWidth,
  forceStrength,
  forceDelay,
  velocityDecay,
  salaryCap
}

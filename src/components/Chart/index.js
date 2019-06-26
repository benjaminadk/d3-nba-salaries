import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import teams from '../../data/teams'
import players from '../../data/players'
import Svg from '../Svg'
import constants from '../constants'
import createNodes from './createNodes'
import { Container, Header, Action, Select, Visualization, Footer, Tooltip } from './styles'

const {
  width,
  height,
  center,
  twoCenters,
  threeCenters,
  fourCenters,
  forceStrength,
  forceDelay,
  velocityDecay,
  salaryCap,
  tooltipWidth
} = constants

const fillColorSalary = d3
  .scaleOrdinal()
  .domain(['low', 'mid', 'high'])
  .range(['#665C61', '#B9B1B5', '#F57A29'])

function Chart() {
  const [mode, setMode] = useState('all')
  const [player, setPlayer] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [averageSalary, setAverageSalary] = useState(null)
  const [maxSalary, setMaxSalary] = useState(null)
  const [minSalary, setMinSalary] = useState(null)
  const [averageAllStar, setAverageAllStar] = useState(null)

  const visualization = useRef(null)
  const simulation = useRef(null)
  const svg = useRef(null)
  const bubbles = useRef(null)
  const tooltip = useRef(null)

  useEffect(() => {
    simulation.current = d3
      .forceSimulation()
      .velocityDecay(velocityDecay)
      .force(
        'x',
        d3
          .forceX()
          .strength(forceStrength)
          .x(center.x)
      )
      .force(
        'y',
        d3
          .forceY()
          .strength(forceStrength)
          .y(center.y)
      )
      .force('charge', d3.forceManyBody().strength(charge))
      .on('tick', ticked)

    simulation.current.stop()

    var nodes = createNodes()

    svg.current = d3
      .select(visualization.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    bubbles.current = svg.current.selectAll('.bubble').data(nodes, d => d.id)

    var bubblesE = bubbles.current
      .enter()
      .append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', d => fillColorSalary(d.payLevel))
      .attr('stroke', d => d3.rgb(fillColorSalary(d.payLevel)).darker())
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail)

    bubbles.current = bubbles.current.merge(bubblesE)

    bubbles.current
      .transition()
      .duration(forceDelay)
      .attr('r', d => d.radius)

    simulation.current.nodes(nodes)

    groupBubbles()

    const mean = d3.mean(players, d => d.value)
    const max = d3.max(players, d => d.value)
    const min = d3.min(players, d => d.value)
    const meanAllStar = d3.mean(players.filter(el => el.allStar), d => d.value)
    setAverageSalary(Math.round(mean))
    setMaxSalary(Math.round(max))
    setMinSalary(Math.round(min))
    setAverageAllStar(Math.round(meanAllStar))
  }, [])

  function showDetail(d) {
    d3.select(this).attr('stroke', '#000000')

    const offsetX = 20
    const offsetY = 10
    const scrollY = window.scrollY
    const e = d3.event
    const curX = e.clientX
    const curY = e.clientY + scrollY
    var left =
      curX + offsetX * 2 + tooltipWidth > window.innerWidth - 50
        ? curX - offsetX * 2 - tooltipWidth
        : curX + offsetX * 2
    var top = curY + offsetY * 2

    setPlayer(d)
    tooltip.current.style.top = top + 'px'
    tooltip.current.style.left = left + 'px'
    tooltip.current.style.opacity = 1
  }

  function hideDetail(d) {
    d3.select(this).attr('stroke', d3.rgb(fillColorSalary(d.payLevel)).darker())
    tooltip.current.style.opacity = 0
  }

  function charge(d) {
    return -Math.pow(d.radius, 2) * forceStrength
  }

  function ticked() {
    bubbles.current.attr('cx', d => d.x).attr('cy', d => d.y)
  }

  function hideTitles() {
    svg.current.selectAll('.title').remove()
  }

  function groupBubbles() {
    setMode('all')
    hideTitles()
    simulation.current.force(
      'x',
      d3
        .forceX()
        .strength(forceStrength)
        .x(center.x)
    )
    simulation.current.alpha(1).restart()
  }

  function splitBubbles(type, team) {
    setMode(type)
    hideTitles()

    var text
    var pos
    var xfunction

    if (type === 'allstar') {
      text = ['All Stars', 'Rest of League']
      pos = twoCenters
      xfunction = allStarX
    } else if (type === 'allnba') {
      text = ['1st Team', '2nd Team', '3rd Team', 'Rest of League']
      pos = fourCenters
      xfunction = allNbaX
    } else if (type === 'points') {
      text = ['1640 and above', '820 and above', 'less than 800']
      pos = threeCenters
      xfunction = pointsX
    } else if (type === 'vorp') {
      text = ['4 and above', '2 through 4', 'less than 2']
      pos = threeCenters
      xfunction = vorpX
    } else if (type === 'team') {
      const teamSalary = d3.sum(players.filter(el => el.team === team), d => d.value)
      text = [`Salary Cap ${formatSalary(salaryCap)}`, `Total Salary: ${formatSalary(teamSalary)}`]
    }

    const titles = svg.current.selectAll('.title').data(text)
    titles
      .enter()
      .append('text')
      .attr('class', 'title')
      .attr('x', (d, i) => (type === 'team' ? threeCenters[1].x : pos[i + 1].x))
      .attr('y', (d, i) => (type === 'team' ? (i + 1) * 40 : 40))
      .attr('text-anchor', (d, i, arr) => {
        if (type === 'team') {
          return 'middle'
        } else if (arr.length === 4) {
          return [0, 1, 2].includes(i) ? 'end' : 'middle'
        } else {
          return i === 0 ? 'end' : i === arr.length - 1 ? 'start' : 'middle'
        }
      })
      .text(d => d)

    simulation.current.force(
      'x',
      d3
        .forceX()
        .strength(forceStrength)
        .x(d => (type === 'team' ? teamX(d, team) : xfunction(d)))
    )
    simulation.current.alpha(1).restart()
  }

  function allStarX(d) {
    if (d.allStar) {
      return twoCenters[1].x
    } else {
      return twoCenters[2].x
    }
  }

  function allNbaX(d) {
    if (d.allNba === 1) {
      return fourCenters[1].x
    } else if (d.allNba === 2) {
      return fourCenters[2].x
    } else if (d.allNba === 3) {
      return fourCenters[3].x
    } else {
      return fourCenters[4].x
    }
  }

  function vorpX(d) {
    if (d.vorp >= 4) {
      return threeCenters[1].x
    } else if (d.vorp >= 2) {
      return threeCenters[2].x
    } else {
      return threeCenters[3].x
    }
  }

  function pointsX(d) {
    if (d.points >= 1640) {
      return threeCenters[1].x
    } else if (d.points >= 820) {
      return threeCenters[2].x
    } else {
      return threeCenters[3].x
    }
  }

  function teamX(d, team) {
    if (d.team === team) {
      return twoCenters[1].x
    } else {
      return twoCenters[2].x
    }
  }

  function onSelectTeam({ target: { value } }) {
    if (value) {
      splitBubbles('team', value)
    } else {
      groupBubbles()
    }
    setSelectedTeam(value)
  }

  function formatSalary(nStr) {
    nStr += ''
    var x = nStr.split('.')
    var x1 = x[0]
    var x2 = x.length > 1 ? '.' + x[1] : ''
    var rgx = /(\d+)(\d{3})/
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    }

    return '$' + x1 + x2
  }

  return (
    <Container>
      <Header>
        <div className='title'>NBA Player Salaries & Performance 2018-19</div>
        <div className='actions'>
          <Action selected={mode === 'all'} onClick={groupBubbles}>
            All Players
          </Action>
          <Action selected={mode === 'allstar'} onClick={() => splitBubbles('allstar')}>
            All Stars
          </Action>
          <Action selected={mode === 'allnba'} onClick={() => splitBubbles('allnba')}>
            All NBA
          </Action>
          <Action selected={mode === 'points'} onClick={() => splitBubbles('points')}>
            Total Points
          </Action>
          <Action selected={mode === 'vorp'} onClick={() => splitBubbles('vorp')}>
            VORP
          </Action>
          <Select selected={mode === 'team'} value={selectedTeam} onChange={onSelectTeam}>
            <option value=''>Select a Team</option>
            {teams.map((el, i) => (
              <option key={el.short} value={el.short}>
                {el.full}
              </option>
            ))}
          </Select>
        </div>
      </Header>
      <Visualization ref={visualization} />
      <Footer>
        <div className='footer'>
          Thanks to{' '}
          <a
            href='https://vallandingham.me/bubble_charts_with_d3v4.html'
            target='_blank'
            rel='noopener noreferrer'
          >
            this blog post
          </a>{' '}
          for inspiring this visualization.
        </div>
      </Footer>
      <Tooltip ref={tooltip}>
        <span className='label'>Player: </span>
        <span className='value'>{player.name}</span>
        <br />
        <span className='label'>Team: </span>
        <span className='value'>{player.team}</span>
        <br />
        <span className='label'>Salary: </span>
        <span className='value'>{player.salary}</span>
        <br />
        <span className='label'>Total Points: </span>
        <span className='value'>{player.points}</span>
        <br />
        <span className='label'>Value Over Replacement: </span>
        <span className='value'>{player.vorp}</span>
        <br />
        <span>{!!player.allStar && <Svg name='star' />}</span>
        <span>{!!player.allNba && <Svg name='nba' />}</span>
        <span>{!!player.allDef && <Svg name='defense' />}</span>
      </Tooltip>
    </Container>
  )
}

export default Chart

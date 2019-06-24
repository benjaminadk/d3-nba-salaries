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
        <p>
          This visualization provides a quick overview of the salaries of NBA players in the
          2018-2019 season. The salaries of players range from {formatSalary(minSalary)}{' '}
          <strong>(Stephen Curry)</strong> to {formatSalary(maxSalary)}{' '}
          <strong>(Ding Yanyuhang)</strong>. The average NBA player salary is{' '}
          {formatSalary(averageSalary)}. The minimum yearly salary for a rookie $582,180 but teams
          will sign 10 day contracts with players when they need to fill a roster spot, accounting
          for the lower salaries.
        </p>
        <p>
          The bubble chart can be split in various ways to separate groups of players. When looking
          at All Stars it seems to make sense that many of the players have large salaries. In fact
          the average salary of an All Star is {formatSalary(averageAllStar)}. With this in mind it
          becomes evident that players on rookie contracts, such as{' '}
          <strong>D`Angelo Russell</strong> and <strong>Karl Anthony-Towns</strong>, who are also
          All Stars, provide a great value for their teams at around $7 million/year. Keep an eye
          out for All Star <Svg name='star' />, All NBA <Svg name='nba' />, and All Defensive{' '}
          <Svg name='defense' /> icons in the player tooltips.
        </p>
        <p>
          Value over replacement player (VORP) is an advanced metric that estimates a players
          contibution to their team vs. a player of minimum salary. VORP takes many offensive and
          even some defensive statistics into account and more information can be found at{' '}
          <a
            href='https://www.basketball-reference.com/about/bpm.html#vorp'
            target='_blank'
            rel='noopener noreferrer'
          >
            Basketball Reference
          </a>
          . <strong>James Harden</strong> had the highest VORP in the 2018-19 season with a score of
          9.9. By separating players with a VORP above 2 and also above 4 some interesting
          observations can be made. Players like <strong>Ben Simmons</strong> with a VORP of 4.1 and
          a salary of $6.4 million/year and <strong>Pascal Siakam</strong>, of the world champion{' '}
          <strong>Toronto Raptors</strong>, with a VORP of 3.5 and a salary of $1.5 million/year,
          are producing at high levels for their teams while being paid relatively small salaries.
          For example, <strong>Siakam's</strong> VORP was only .1 less than Final's MVP{' '}
          <strong>Kawhi Leonard's</strong> 3.6. Granted, this version of VORP is based on the
          regular season and the amount of minutes played is figured in. This somewhat diminishes{' '}
          <strong>Leonard's</strong> VORP since he missed 22 games for load management.
        </p>
        <p>
          VORP scores can also give us an idea of which players may not be living up to their
          contracts. The highest paid player with a VORP below 2 is <strong>Gordon Hayward</strong>{' '}
          of the <strong>Boston Celtics</strong>, making a team high $31.2 million/year.{' '}
          <strong>Hayward</strong> had signed a large contract then suffered a career altering leg
          fracture in the second game of the 2017-18 season and struggled most of this season unable
          to play to his previous level.
        </p>
        <p>
          Total Points is an another way to look at the overall contribution of a player. I have
          broken players into three categories, those who scored an average of 20 points per team
          game, those who scored an average of 10 points per team game, and everyone else. Note that
          this inherently takes availablity and consistency into account. For example,{' '}
          <strong>LeBron James</strong> averaged 27 points per game but missed nearly 30 games due
          to a groin injury, ending up with a total of 1505 total points. It also becomes apparent
          how costly injuries can be to a team's bottom line, and in a salary capped league,
          ultimate success. <strong>Victor Oladipo</strong> is paid $21 million/year but suffered a
          serious knee injury after playing 36 games he contributed only 675 points to the{' '}
          <strong>Indiana Pacer's</strong> season.
        </p>
        <div className='footer'>
          Thanks to{' '}
          <a
            href='https://vallandingham.me/bubble_charts_with_d3v4.html'
            target='_blank'
            rel='noopener noreferrer'
          >
            this blog post
          </a>{' '}
          for inspiring this visualization. Check out my blog post explaing this project{' '}
          <a href='#' target='_blank' rel='noopener noreferrer'>
            here
          </a>
          .
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

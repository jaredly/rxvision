'use strict'

import utils from './utils'
import Tip from './tip'
import {asString} from '../lib/utils'

export default class Viz {
  constructor (node) {
    this.setup(node)
  }

  teardown() {
    this.div.remove()
  }

  setup(node) {
    this.config = {
      crad: 5,
      cmar: 5,
      margin: 40,
      width: 1500,
      leftBarWidth: 150
    }

    let crad = this.config.crad
    let cmar = this.config.cmar
    let margin = this.config.margin
    let leftBarWidth = this.config.leftBarWidth

    let height = 10 * (crad * 2 + cmar) - cmar + margin * 2
    let div = this.div =  d3.select(node).append('div')
      .attr('class', 'rxvision')
    let svg = div.append('svg')
      .attr('width', this.config.width)
      .attr('height', height)
    let mainGroup = svg.append('g')
    let groups = {}

    let groupNames = 'backs,ticks,lines,streams'.split(',')
    groupNames.forEach(name => groups[name] = mainGroup.append('g').attr('class', name))

    groups.swimLines = groups.lines.append('g').attr('class', 'swim-lines')
    groups.dataLinesBack = groups.lines.append('g').attr('class', 'data-lines-back')
    groups.dataLines = groups.lines.append('g').attr('class', 'data-lines')

    mainGroup.attr('transform', `translate(${margin + leftBarWidth}, ${margin})`)

    let leftBarGroup = svg.append('g').attr('class', 'left-bar')

    this.tip = new Tip(div)
    this.svg = svg
    this.groups = groups
    this.leftBarGroup = leftBarGroup
  }

  process(data, isSanitized) {
    let {streams, posMap, sids} = utils.processData(data)

    let crad = this.config.crad
    let cmar = this.config.cmar
    let margin = this.config.margin
    let width = this.config.width - this.config.leftBarWidth - margin*2

    let height = streams.length * (crad * 2 + cmar) - cmar + margin * 2
    let yscale = (height - margin*2) / streams.length

    this.svg.attr('height', height)

    let timeDiff = data.groups[data.groups.length-1].start - data.groups[0].start
    let totalWidth = data.groups.reduce((w, g) => w + g.width, 0)
    let circleWidth = totalWidth * (crad * 2 + cmar) - cmar
    /*
    let flexWidth = 499 // width - circleWidth
    if (flexWidth < 500) {
      flexWidth = 500
      width = flexWidth + circleWidth + margin*2 + this.config.leftBarWidth
      this.config.width = width
      this.svg.attr('width', width)
    }
    */
    let timeScale = .01
    let flexWidth = timeScale * timeDiff
    // let timeScale = flexWidth / timeDiff

      width = flexWidth + circleWidth + margin*2 + this.config.leftBarWidth
      this.config.width = width
      this.svg.attr('width', width)

    let starts = utils.getStarts(data.groups, timeScale, crad, cmar)
    this.isSanitized = isSanitized

    this.veryStart = data.groups[0].start

    this.ysid = sid => sids.indexOf(sid) * yscale + crad

    this.x = (gid, xoff) => {
      let off = (xoff + 1) * (crad * 2 + cmar) - cmar - crad
      return starts[gid] + off
    }

    let dataLines = utils.getDataLines(posMap, this.x, this.ysid)

    // ok make things
    this.makeLeftBar(streams)
    this.makeBacks(data.groups, height)
    this.makeStreams(streams, posMap)
    this.makeSwimLines(sids, data.streams)
    this.makeDataLines(dataLines)
  }

  showValueTip(x, value) {
    let margin = this.config.margin
    let y = this.ysid(value.sid) + margin + 30
    x += this.config.leftBarWidth + margin + 10
    let text = 'Value: ' + (this.isSanitized ? value : asString(value.value)).slice(0, 50) + '\n' +
                (value.ts - this.veryStart)/1000 + 's\n'
    this.tip.show(x, y, text)
  }

  makeLeftBar(streams) {
    // Make the Left Bar

    let crad = this.config.crad
    let cmar = this.config.cmar
    let margin = this.config.margin
    let leftBarWidth = this.config.leftBarWidth

    let labels = this.leftBarGroup.selectAll('g.label').data(streams)
    let labelsE = labels.enter()
      .append('g').attr('class', d => `label ${d.type}`)
      .on('mouseover', d => this.tip.show(leftBarWidth, this.ysid(d.id) + margin, utils.readStack(d.stack)))
      .on('mouseout', () => this.tip.hide())

    labelsE.append('circle')
      .attr('cx', leftBarWidth - margin)
      .attr('cy', 0)
      .attr('r', crad)

    labelsE.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .text(d => d.title + ' [' + d.type + ']')
      .attr('text-anchor', 'end')
      .attr('x', leftBarWidth - margin - crad - cmar)
      .text(d => d.title)

    labels
      .attr('transform', d => `translate(${margin}, ${margin + this.ysid(d.id)})`)

    labels.exit().remove()
  }

  makeBacks(groups, height) {
    let {crad, cmar, margin} = this.config

    let backs = this.groups.backs
      .selectAll('rect').data(groups)
    backs
      .enter().append('rect')
    backs
      .attr('x', (d, i) => this.x(i, 0) - crad)
      .attr('width', d => d.width * (crad * 2 + cmar) - cmar)
      .attr('y', -margin/2)
      .attr('height', height - margin)
    backs.exit().remove()
  }

  makeSwimLines(sids, streamMap) {
    let {margin, width} = this.config
    let swimLines = this.groups.swimLines
      .selectAll('path').data(sids)
    swimLines
      .enter().append('path')
    swimLines
      .attr('d', d => `M ${-margin} ${this.ysid(d)} L ${width} ${this.ysid(d)}`)
      .attr('class', d => streamMap[d].type)
    swimLines.exit().remove()
  }

  makeDataLines(dataLines) {
    let tweenback = this.groups.dataLinesBack
      .selectAll('path').data(dataLines)
    tweenback
      .enter().append('path')
      .on('mouseover', d => {
        this.groups.streams.selectAll('.uid-' + d.uid + ',.from-' + d.uid).classed('active', true)
        this.groups.lines.selectAll('.uid-' + d.uid).classed('active', true)
      })
      .on('mouseout', d => {
        this.groups.streams.selectAll('.uid-' + d.uid + ',.from-' + d.uid).classed('active', false)
        this.groups.lines.selectAll('.uid-' + d.uid).classed('active', false)
      })
    tweenback
      .attr('class', d => 'uid-' + d.uid)
      .attr('d', d => `M ${d.from.x} ${d.from.y} L ${d.to.x} ${d.to.y}`)
    tweenback.exit().remove()

    let tweenlines = this.groups.dataLines
      .selectAll('path').data(dataLines)
    tweenlines
      .enter().append('path')
    tweenlines
      .attr('class', d => 'uid-' + d.uid)
      .attr('d', d => `M ${d.from.x} ${d.from.y} L ${d.to.x} ${d.to.y}`)
    tweenlines.exit().remove()
  }

  makeStreams(streams, posMap) {
    let ssel = this.groups.streams.selectAll('g.stream').data(streams)
    ssel.enter().append('g')
      .attr('class', 'stream')
    ssel
      .attr('transform', d => `translate(0, ${this.ysid(d.id)})`)
    let makeDots = this.makeDots.bind(this)
    ssel.each(function (d) {makeDots(posMap, d, this)})
    ssel.exit().remove()
  }

  makeDots(posMap, stream, node) {
    let crad = this.config.crad
    let cmar = this.config.cmar

    var dot = d3.select(node).selectAll('g.dot')
      .data(stream.type === 'subscribe' ? stream.values : stream.values.filter(v => v.type !== 'recv' ||
                                      !posMap[v.uid].to.length ||
                                      posMap[v.uid].toAsync))
    let entered = dot.enter().append('g')
      .attr('class', d => 'dot uid-' + d.uid + (d.type === 'send' ? ' from-' + posMap[d.uid].from : ''), true)
      .on('mouseover', d => {
        this.showValueTip(this.x(d.agroup, d.xpos), d)

        this.groups.streams.selectAll('.uid-' + d.uid + ',.from-' + d.uid).classed('active', true)
        this.groups.lines.selectAll('.uid-' + d.uid).classed('active', true)
        let from = posMap[d.uid].from
        if (from && d.type !== 'recv') {
          this.groups.streams.selectAll('.uid-' + from).classed('active', true)
          this.groups.lines.selectAll('.uid-' + from).classed('active', true)
        }
      })
      .on('mouseout', d => {
        this.tip.hide()

        this.groups.streams.selectAll('.uid-' + d.uid + ',.from-' + d.uid).classed('active', false)
        this.groups.lines.selectAll('.uid-' + d.uid).classed('active', false)
        let from = posMap[d.uid].from
        if (from && d.type !== 'recv') {
          this.groups.streams.selectAll('.uid-' + from).classed('active', false)
          this.groups.lines.selectAll('.uid-' + from).classed('active', false)
        }
      })

    dot
      .attr('transform', d => `translate(${this.x(d.agroup, d.xpos)}, 0)`)
      .classed({
        'start': d => (!posMap[d.uid].from && d.type === 'send'),
        activate: d => d.type === 'active' && d.value,
        deactivate: d => d.type === 'active' && !d.value,
        // inactive: d => !d.active,
        end: d => stream.type === 'subscribe' || stream.type === 'log' || (d.type === 'recv' && !posMap[d.uid].to.length),
        recv: d => d.type === 'recv',
      })

    let backCircle = entered.append('circle')
      .attr('class', 'back')
      .attr('cx', 0)
      .attr('cy', 0)
    let circle = entered.append('circle')
      .attr('class', 'front')
      .attr('cx', 0)
      .attr('cy', 0)

    dot.select('circle.front')
      .attr('r', d => {
        let pm = posMap[d.uid]
        if (stream.type === 'subscribe') return crad
        if (d.type === 'send' && (!pm.from || !pm.ends.length)) return crad
        if (d.type === 'recv' && !pm.to.length) return crad
        if (d.type === 'recv' && !pm.sourced) return crad
        return crad / 2
      })
    dot.select('circle.back')
      .attr('r', d => {
        let pm = posMap[d.uid]
        if (stream.type === 'subscribe') return crad * 1.5
        if (d.type === 'send' && (!pm.from || !pm.ends.length)) return crad*1.5
        if (d.type === 'recv' && !pm.to.length) return crad*1.5
        if (d.type === 'recv' && !pm.sourced) return crad*1.5
        return crad
      })

    dot.exit().remove()
  }
}


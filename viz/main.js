'use strict'

import utils from './utils'
import Tip from './tip'

export default class Viz {
  constructor (node) {
    this.setup(node)
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
    let svg = d3.select(node).append('svg').attr('width', this.config.width).attr('height', height)
    let mainGroup = svg.append('g')
    let groups = {}

    let groupNames = 'backs,ticks,lines,streams'.split(',')
    groupNames.forEach(name => groups[name] = mainGroup.append('g').attr('class', name))


    mainGroup.attr('transform', `translate(${margin + leftBarWidth}, ${margin})`)

    let leftBarGroup = svg.append('g').attr('class', 'left-bar')

    this.tip = new Tip(node)
    this.svg = svg
    this.groups = groups
    this.leftBarGroup = leftBarGroup
  }

  process(data) {
    let {streams, posMap, sids} = utils.processData(data)

    let crad = this.config.crad
    let cmar = this.config.cmar
    let margin = this.config.margin
    let width = this.config.width

    let height = streams.length * (crad * 2 + cmar) - cmar + margin * 2
    let yscale = (height - margin*2) / streams.length

    this.svg.attr('height', height)

    let timeDiff = data.groups[data.groups.length-1].start - data.groups[0].start
    let totalWidth = data.groups.reduce((w, g) => w + g.width, 0)
    let flexWidth = width - (totalWidth * (crad * 2 + cmar) - cmar)
    let timeScale = flexWidth / timeDiff

    let starts = utils.getStarts(data.groups, timeScale, crad, cmar)

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
    let y = this.ysid(value.sid) + margin + 40
    x += this.config.leftBarWidth + margin + 20
    let text = 'Value: ' + value.value + '\n' +
                (value.ts - this.veryStart)/1000 + 's\n'
    this.tip.show(x, y, text)
  }

  makeLeftBar(streams) {
    // Make the Left Bar

    let crad = this.config.crad
    let cmar = this.config.cmar
    let margin = this.config.margin
    let leftBarWidth = this.config.leftBarWidth

    let labels = this.leftBarGroup.selectAll('g.label')
      .data(streams).enter()
      .append('g').attr('class', d => `label ${d.type}`)
      .attr('transform', d => `translate(${margin}, ${margin + this.ysid(d.id)})`)

    let lCircle = labels.append('circle')
      .attr('cx', leftBarWidth - margin)
      .attr('cy', 0)
      .attr('r', crad)

    let lText = labels.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .text(d => d.title + ' [' + d.type + ']')

    lText
      .attr('text-anchor', 'end')
      .attr('x', leftBarWidth - margin - crad - cmar)
      .text(d => d.title)

    labels
      .on('mouseover', d => this.tip.show(leftBarWidth, this.ysid(d.id) + margin, utils.readStack(d.stack)))
      .on('mouseout', () => this.tip.hide())
  }

  makeBacks(groups, height) {
    let {crad, cmar, margin} = this.config

    let backs = this.groups.backs
      .selectAll('rect').data(groups)
      .enter()
      .append('rect')
      .attr('x', (d, i) => this.x(i, 0) - crad)
      .attr('width', d => d.width * (crad * 2 + cmar) - cmar)
      .attr('y', -margin/2)
      .attr('height', height - margin)
  }

  makeSwimLines(sids, streamMap) {
    let {margin, width} = this.config
    let swimlines = this.groups.lines.append('g').attr('class', 'swim-lines')
      .selectAll('path').data(sids)
      .enter()
      .append('path')
      .attr('d', d => `M ${-margin} ${this.ysid(d)} L ${width} ${this.ysid(d)}`)
      .attr('class', d => streamMap[d].type)
  }

  makeDataLines(dataLines) {
    let tweenback = this.groups.lines.append('g').attr('class', 'data-lines-back')
      .selectAll('path').data(dataLines)
      .enter().append('path')
      .attr('class', d => 'uid-' + d.uid)
      .attr('d', d => `M ${d.from.x} ${d.from.y} L ${d.to.x} ${d.to.y}`)
      .on('mouseover', d => {
        this.groups.streams.selectAll('.uid-' + d.uid + ',.from-' + d.uid).classed('active', true)
        this.groups.lines.selectAll('.uid-' + d.uid).classed('active', true)
      })
      .on('mouseout', d => {
        this.groups.streams.selectAll('.uid-' + d.uid + ',.from-' + d.uid).classed('active', false)
        this.groups.lines.selectAll('.uid-' + d.uid).classed('active', false)
      })
    let tweenlines = this.groups.lines.append('g').attr('class', 'data-lines')
      .selectAll('path').data(dataLines)
      .enter().append('path')
      .attr('class', d => 'uid-' + d.uid)
      .attr('d', d => `M ${d.from.x} ${d.from.y} L ${d.to.x} ${d.to.y}`)
  }

  makeStreams(streams, posMap) {
    let ssel = this.groups.streams.selectAll('g.stream').data(streams)
    ssel.enter().append('g')
      .attr('class', 'stream')
      .attr('transform', d => `translate(0, ${this.ysid(d.id)})`)
    let makeDots = this.makeDots.bind(this)
    ssel.each(function (d) {makeDots(posMap, d, this)})
    ssel.exit().remove()
  }

  makeDots(posMap, stream, node) {
    let crad = this.config.crad
    let cmar = this.config.cmar

    var dot = d3.select(node).selectAll('g.dot')
      .data(stream.values.filter(v => v.type !== 'recv' ||
                                      !posMap[v.uid].to.length ||
                                      posMap[v.uid].toAsync))
    let entered = dot.enter().append('g')
      .attr('class', d => 'dot uid-' + d.uid + (d.type === 'send' ? ' from-' + posMap[d.uid].from : ''), true)
      .attr('transform', d => `translate(${this.x(d.agroup, d.xpos)}, 0)`)
      .classed({
        'start': d => (!posMap[d.uid].from && d.type === 'send'),
        end: d => d.type === 'recv' && !posMap[d.uid].to.length,
        recv: d => d.type === 'recv',
      })
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
    let backCircle = entered.append('circle')
      .attr('class', 'back')
      .attr('r', d => {
        let pm = posMap[d.uid]
        if (d.type === 'send' && (!pm.from || !pm.ends.length)) return crad*1.5
        if (d.type === 'recv' && !pm.to.length) return crad*1.5
        if (d.type === 'recv' && !pm.sourced) return crad*1.5
        return crad
      })
      .attr('cx', 0)
      .attr('cy', 0)
    let circle = entered.append('circle')
      .attr('r', d => {
        let pm = posMap[d.uid]
        if (d.type === 'send' && (!pm.from || !pm.ends.length)) return crad
        if (d.type === 'recv' && !pm.to.length) return crad
        if (d.type === 'recv' && !pm.sourced) return crad
        return crad / 2
      })
      .attr('cx', 0)
      .attr('cy', 0)
    dot.exit().remove()
  }
}


// rx-streams viz

import React from 'react'
let {PropTypes: PT} = React

import calc from './calc'

export default React.createClass({
  propTypes: {
    tracer: PT.object,
  },
  componentWillMount() {
    this.props.tracer.config.onValue = this.gotValue
  },
  getInitialState() {
    return {
      streams: []
    }
  },
  render() {
  }
})

function showPoints(groups, posmap, width, height, margin) {
  let w = width - margin*2
  let h = height - margin*2
  return <svg width={900} height={600}>
    {groups.map(group => <path className='group-line' d={'M 0 ' + group.y + ' L 800 ' + group.y}/>)}
    {groups.map(group => <text className='group-name' x={group.x} y={group.y}>{group.name}</text> )}
    {Object.keys(posmap).map(id => {
      let {x, y, from, to, ix, text} = posmap[id]
      let isEnd = !to.length
      let isStart = !from
      let rad = isEnd || isStart ? 8 : 5;
      return <g className="value-group">
        {to.map(toid => {
          let {x: ox, y: oy, async} = posmap[toid];
          let path = `M ${x} ${y} L ${ox} ${oy}`;
          return <path d={path} className={'connection' + (async ? ' connection-async' : '')} strokeWidth={3}/>
        })}
        {to.map(toid => {
          let {x, y, from, to} = posmap[toid];
          let rad = (!from || !to.length) ? 13 : 10;
          return <circle cx={x} cy={y} className="recv" r={rad}/>
        })}
        <circle cx={x} cy={y} className="recv" r={rad + 5}/>
        <circle style={{opacity: ix / 10 + 1}} cx={x} cy={y} r={rad} className={'value' + (isEnd ? " value-end" : '') + (isStart ? ' value-start' : '')}/>
        <text x={x+10} y={y}>{text}</text>
      </g>
    })}
  </svg>
}

// rx-streams viz

import React from 'react'

export {pointed, settle, showPoints}

function findSucc(data, tid) {
  return Object.keys(data).filter(name => data[name].previf == tid)
}

function renderPoints(item, x, y, sep, posmap) {
  let from = null
  return {x, y, vids: item.values.map((value, i) => {
      let rets = []
      let cx = x
        , cy = y
      if (value.type === 'send') {
        x += sep
        if (posmap[from]) {
          posmap[from].to.push(value.uid)
        }
        posmap[value.uid] = {ix: i, x: cx, y: cy, to: [], from, text: value.value, async: value.async}
        return value.uid
      } else {
        from = value.uid
      }
    }).filter(x => !!x),
    name: item.name,
    tid: item.tid,
    previf: item.previf,
  }
}

function pointed(data, width, height, margin, sep) {
  let tops = findSucc(data, null)
  let w = width - margin*2
  let h = height - margin*2

  let y = margin
  let x = margin
  let r = 5
  
  let yd = h / Object.keys(data).length

  let groups = []
  let grix = {}
  let posmap = {}
  
  let render = tid => {
    let item = data[tid]
    groups.push(renderPoints(item, x, y, sep, posmap))
    grix[tid] = groups.length - 1
    y += yd
    let succ = findSucc(data, tid)
    succ.forEach(render)
  }

  tops.forEach(render)
  return {groups, posmap}
}

function settle(groups, posmap) {
  let moved = false
  let sep = 30
  groups.forEach(group => {
    let px = null
      , pid = null
    group.vids.forEach(id => {
      let {x, y, to, async} = posmap[id]
      if (px !== null && x - px < sep) {
        let df = (sep - (x - px)) / 2
        x += df
        posmap[id].x = x
        if (posmap[pid].x > df + 20) {
          posmap[pid].x -= df
          px -= df
        }
      }
      px = x
      pid = id
      if (!to.length) return
      to.forEach(tid => {
        let {x: ox, y: oy, async} = posmap[tid]
        if (async || Math.abs(x - ox) < 1) return
        posmap[tid].x += (x-ox) / 2
        x += (ox-x) / 2
        posmap[id].x = x
        moved = true
      })
    })
  })
  return moved
}
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

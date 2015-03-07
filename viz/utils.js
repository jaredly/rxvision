'use strict'

export default {readStack, processData, getStarts, getDataLines}

function getPosMap(streams) {
  let posMap = {}
  streams.forEach(stream => {
    let from = null
    stream.values.forEach(value => {
      if (value.type !== 'recv') {
        posMap[value.uid] = {
          sid: value.sid,
          xpos: value.xpos,
          async: value.async,
          agroup: value.agroup,
          from: from,
          toAsync: posMap[value.uid] ? posMap[value.uid].toAsync : false,
          to: posMap[value.uid] ? posMap[value.uid].to : [],
          sourced: true,
          ends: posMap[value.uid] ? posMap[value.uid].ends : []
        }
        if (posMap[from]) {
          posMap[from].to.push(value.uid)
          if (value.async || value.agroup !== posMap[from].agroup || value.xpos !== posMap[from].xpos) {
            posMap[from].toAsync = true
          }
        }
      } else if (value.type === 'recv') {
        if (!posMap[value.uid]) {
          posMap[value.uid] = {ends: [], to: [], sourced: false}
        }
        from = value.uid
        posMap[value.uid].ends.push({
          sid: value.sid,
          xpos: value.xpos,
          agroup: value.agroup,
        })
      }
    })
  })
  return posMap
}

function settlePos(posMap, sids) {
  let changed = false
  Object.keys(posMap).forEach(uid => {
    let pm = posMap[uid]
    pm.ends.forEach(end => {
      if (sids.indexOf(end.sid) < sids.indexOf(pm.sid)) {
        sids.splice(sids.indexOf(end.sid), 1)
        sids.splice(sids.indexOf(pm.sid) + 1, 0, end.sid)
        changed = true
      }
    })
  })
  return changed
}

function getStarts(groups, timeScale, crad, cmar) {
  let starts = []
    , last = 0
    , lstart = groups[0].start
  groups.forEach(group => {
    last += (group.start - lstart) * timeScale
    starts.push(last)
    lstart = group.start
    last += group.width * (crad * 2 + cmar) - cmar
  })

  return starts
}

function getDataLines(posMap, x, ysid) {
  let dataLines = []
  Object.keys(posMap).forEach(uid => {
    let {ends, agroup, xpos, sid} = posMap[uid]
    ends.forEach(dest => {
      dataLines.push({
        id: uid,
        uid,
        from: {
          y: ysid(sid),
          x: x(agroup, xpos),
        },
        to: {
          y: ysid(dest.sid),
          x: x(dest.agroup, dest.xpos),
        }
      })
    })
  })
  return dataLines
}

function processData(data) {
  let streams = Object.keys(data.streams).map(id => data.streams[id])
  let sids = streams.map(s => s.id)

  let posMap = getPosMap(streams)

  for (let i=0; i<100; i++) {
    if (!settlePos(posMap, sids)) break
  }

  return {streams, posMap, sids}
}

function readStack(stack) {
  let parts = stack.trim().split(/ /g)
  parts.shift() // 'at'
  let name = '(main)'
  if (parts.length === 2) { // in a function
    name = parts.shift()
    parts[0] = parts[0].slice(1, -1)
  }
  if (parts[0] === 'eval') {
    name = 'eval'
    parts = parts.slice(-1)
    parts[0] = parts[0].slice(0, -1)
  }
  let finfo = parts[0].split('/').slice(-1)[0].split(':')
  return name + ' ' + finfo[0] + ` (${finfo.slice(1).join(':')})`
}




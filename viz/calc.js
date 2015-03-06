
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


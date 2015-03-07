'use strict'

import utils from '../lib/utils'

export default function wrap(Rx, tracer) {
  let oProto = Rx.Observable.prototype
  let oMap = oProto.map

  // decorate fromEvent
  utils.decorate(Rx.Observable, 'fromEvent', fn => function (el, evt) {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'fromEvent',
      title: `"${evt}" event`,
      source: null,
      stack: stack,
      meta: {
        el: arguments[0],
      },
    })
    let obs = oMap.call(
      fn.apply(this, arguments),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  })

  // decorate fromArray
  utils.decorate(Rx.Observable, 'fromArray', fn => function (arr) {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'fromArray',
      title: `from array (ln ${arr.length})`,
      source: null,
      stack: stack,
      meta: {
        array: arr,
      },
    })
    let obs = oMap.call(
      fn.apply(this, arguments),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  })

  // decorate fromEvent
  utils.decorate(Rx.Observable, 'create', fn => function () {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'create',
      title: 'create',
      source: null,
      stack: stack,
    })
    let obs = oMap.call(
      fn.apply(this, arguments),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  })

  utils.decorate(oProto, 'share', fn => function () {
    var obs = fn.apply(this, arguments)
    if (this.__rxvision_id) {
      obs.__rxvision_id = this.__rxvision_id
      tracer.streams[this.__rxvision_id].hot = true
    }
    return obs
  })

  //TODO(jared): should we just wrap everything?
  var wrapping = ['map', 'flatMap', 'select', 'startWith', 'combineLatest', 'merge']
  wrapping.forEach(name => utils.decorate(oProto, name, fn => function () {
    let previd = this.__rxvision_id
    if (!previd) return fn.apply(this, arguments)
    let stack = tracer.getStack() // are we in user code or rx code?
    if (!stack) return fn.apply(this, arguments)

    let sid = tracer.addStream({
      type: name,
      title: name,
      source: previd,
      stack: stack,
      // is there meta info of interest here?
    })

    let args = [].slice.call(arguments)

    // item specific things
    if (name === 'merge') {
      if ('number' !== typeof args[0]) {
        let other = args[0]
        let isWrapped = !!other.__rxvision_id
        other.__rxvision_id = other.__rxvision_id || tracer.addStream({
          type: 'merge',
          title: 'from merge with ' + previd,
          source: null,
          stack: null,
          meta: {
            mergedWith: previd,
            result: sid,
          },
        })

        args[0] = oMap.call(other, tracer.traceMap(sid, isWrapped ? 'recv' : 'pass'))
      }
    } else if (name === 'combineLatest') {
      for (let i=0; i<args.length - 1; i++) {
        if (Array.isArray(args[i])) continue // TODO(jared): deal
        let old = args[i]
        let isWrapped = !!old.__rxvision_id
        old.__rxvision_id = old.__rxvision_id || tracer.addStream({
          type: 'combineLatest',
          title: 'from combineLatest with ' + previd,
          source: null,
          stack: null,
          meta: {
            combinedWith: previd,
            result: sid,
          },
        })
        args[i] = oMap.call(old, tracer.traceMap(sid, isWrapped ? 'recv' : 'pass'))
      }
    } else if (name === 'flatMap') {
      let mapper = args[0]
      args[0] = function () {
        let full = arguments[0]
        arguments[0] = arguments[0].value
        let childObs = mapper.apply(this, arguments)
        if (childObs.__rxvision_id) {
          tracer.trace(childObs.__rxvision_id, 'recv', full)
        }
        return oMap.call(childObs, tracer.traceMap(sid, 'recv'))
      }
      // args[0] = oMap.call(args[0], tracer.traceMap(sid, 'recv'))
    }

    let obs = oMap.call(
      fn.apply(
        name === 'flatMap' ? this : oMap.call(this, tracer.traceMap(sid, 'recv')),
        args),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  }))

  utils.decorate(oProto, 'subscribe', fn => function (onValue, onErr, onComp) {
    if (!onValue || typeof onValue !== 'function') return fn.apply(this, arguments)
    let previd = this.__rxvision_id
    if (!previd) return fn.apply(this, arguments)
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'subscribe',
      title: 'subscription',
      stack: stack,
      source: previd,
    })

    // TODO(jared): log errors, completions
    return fn.apply(
      oMap.call(this, tracer.traceMap(sid, 'recv')),
      arguments)
  })
}


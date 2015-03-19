'use strict'

import utils from '../lib/utils'

export default function wrap(Kefir, tracer, streambag) {
  let sProto = Kefir.Stream.prototype
  let pProto = Kefir.Property.prototype
  let oProto = Kefir.Observable.prototype
  let sMap = sProto.map
  let pMap = pProto.map
  let sWH = sProto.withHandler
  let pWH = pProto.withHandler

  function decorateWH(name, dec) {
    utils.decorate(sProto, name, dec(sWH))
    utils.decorate(pProto, name, dec(pWH))
  }

  function decorate(name, dec) {
    utils.decorate(sProto, name, dec(sMap))
    utils.decorate(pProto, name, dec(pMap))
  }

  function decoractive(obs) {
    utils.decorate(obs, '_setActive', fn => function (active) {
      if (active !== this._active) {
        tracer.trace(obs.__rxvision_id, 'active', null, active)
      }
      return fn.call(this, active)
    })
  }

  function mapit(withHandler, obs, sid, type) {
    return withHandler.call(obs, (emitter, evt) => {
      if (evt.type === 'value' || evt.type === 'error') {
        evt.value = tracer.trace(sid, type, null, evt.value, evt.type)
      } else {
        evt.value = tracer.trace(sid, type, null, null, evt.type)
      }
      emitter.emitEvent(evt)
    })
  }

  decorateWH('setName', _ => fn => function (source, name) {
    let res = fn.apply(this, arguments)
    if (this.__rxvision_id && !name) {
      tracer.setStreamName(this.__rxvision_id, source)
    }
    return res
  })

  decorateWH('take', _ => fn => function () {
    let res = fn.apply(this, arguments)
    if (this.__rxvision_id) {
      res.__rxvision_id = this.__rxvision_id
      if (streambag) streambag.add(res)
    }
    return res
  })

  let wrapping = ['pluck', 'invoke', 'map', 'mapTo', 'selectBy', 'combine', 'merge', 'flatMap', 'flatMapLatest', 'flatMapConcat', 'flatMapFirst', 'flatMapConcurLimit']
  let twoObs = ['filterBy']

  wrapping.concat(twoObs).forEach(name => decorateWH(name, withHandler => fn => function () {
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

    if (twoObs.indexOf(name) !== -1) {
      let other = args[0]
      let isWrapped = !!other.__rxvision_id
      if (streambag) streambag.add(other)
      other.__rxvision_id = other.__rxvision_id || tracer.addStream({
        type: name,
        title: 'from ' + name + ' with ' + previd,
        source: null,
        active: other._active,
        stack: null,
        meta: {
          combineWith: previd,
          result: sid,
        },
      })

      args[0] = mapit(withHandler, other, sid, isWrapped ? 'recv' : 'pass')
      // args[0] = map.call(other, tracer.traceMap(sid, isWrapped ? 'recv' : 'pass'))
    }

    if (name.indexOf('flatMap') === 0) {
      let mapper = args[0]
      args[0] = function () {
        let full = arguments[0]
        arguments[0] = arguments[0].value
        let childObs = mapper.apply(this, arguments)
        if (childObs.__rxvision_id) {
          tracer.trace(childObs.__rxvision_id, 'recv', full)
        }
        return mapit(withHandler, childObs, sid, 'recv')
        // return map.call(childObs, tracer.traceMap(sid, 'recv'))
      }
    }

    let flatting = name.indexOf('flatMap') === 0

    let obs = mapit(withHandler,
      fn.apply(
        flatting ? this : mapit(withHandler, this, sid, 'recv'),
        args
      ),
      sid,
      'send'
    )

    /*
    let obs = map.call(
      fn.apply(
        name.indexOf('flatMap') === 0 ? this : map.call(this, tracer.traceMap(sid, 'recv', this)),
        args),
      tracer.traceMap(sid, 'send', this)
    )
    */
    obs.__rxvision_id = sid
    if (streambag) streambag.add(obs)
    decoractive(obs)
    obs._name = this._name
    return obs
  }))


  // initializers
  let initializers = {
    fromEvent(el, evt) {
      return {
        title: `"${evt}" event`,
        meta: {
          el,
        }
      }
    },
    // emitter: false,
    // bus: false,
    sequentially: false,
    repeatedly: false,
    fromPoll: false,
    withInterval: false,
    fromCallback: false,
    fromBinder: false,
    fromNodeCallback: false,
    fromPromise: false,
    interval(ival, value) {
      return {
        title: value + ' every ' + ival + 'ms',
        meta: {
          value: value
        }
      }
    },
    later: false,
  }

  Object.keys(initializers).forEach(name => utils.decorate(Kefir, name, fn => function () {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let options = {
      type: name,
      title: name,
      source: null,
      stack: stack,
      meta: { },
    }
    if (initializers[name]) {
      let extra = initializers[name].apply(null, arguments)
      for (let attr in extra) {
        options[attr] = extra[attr]
      }
    }
    let sid = tracer.addStream(options)
    let orig = fn.apply(this, arguments)
    let obs = mapit(sWH, orig, sid, 'send')
    /*
    let obs = sMap.call(
      orig,
      tracer.traceMap(sid, 'send', this)
    )
    */
    obs.__rxvision_id = sid
    if (streambag) streambag.add(obs)
    decoractive(obs)
    obs._name = orig._name
    return obs
  }))

  utils.decorate(Kefir, 'emitter', fn => function (el, evt) {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let options = {
      type: 'emitter',
      title: 'emitter',
      source: null,
      stack: stack,
      meta: { },
    }
    let sid = tracer.addStream(options)
    let em = fn.apply(this, arguments)
    em.__rxvision_id = sid
    if (streambag) streambag.add(em)
    decoractive(em)
    return em
  })

  let emitterLike = ['emitter', 'pool', 'bus']

  emitterLike.map(name => utils.decorate(Kefir, name, fn => function (el, evt) {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let options = {
      type: name,
      title: name,
      source: null,
      stack: stack,
      meta: { },
    }
    let sid = tracer.addStream(options)
    let em = fn.apply(this, arguments)
    em.__rxvision_id = sid
    if (streambag) streambag.add(em)
    decoractive(em)
    if (name === 'bus' || name === 'pool') {
      this._rxv_plugmap = new Map()
    }
    return em
  }))

  utils.decorate(Kefir.Emitter.prototype, 'error', fn => function (value) {
    if (!this.__rxvision_id) return fn.apply(this, arguments)
    value = tracer.trace(this.__rxvision_id, 'send', this, value)
    fn.call(this, value)
  })

  utils.decorate(Kefir.Emitter.prototype, 'emit', fn => function (value) {
    if (!this.__rxvision_id) return fn.apply(this, arguments)
    value = tracer.trace(this.__rxvision_id, 'send', this, value)
    fn.call(this, value)
  })

  utils.decorate(Kefir.Bus.prototype, 'emit', fn => function (value) {
    if (!this.__rxvision_id) return fn.apply(this, arguments)
    value = tracer.trace(this.__rxvision_id, 'send', this, value)
    fn.call(this, value)
  })

  let pools = [Kefir.Bus.prototype, Kefir.Pool.prototype]

  pools.forEach(proto => {
    utils.decorate(proto, 'plug', fn => function (value) {
      if (!this.__rxvision_id) return fn.apply(this, arguments)
      let other = sMap.apply(value, tracer.traceMap(this.__rxvision_id, 'pass-wrapped', this))
      if (!this._rxv_plugmap) {
        this._rxv_plugmap = new Map()
      }
      this._rxv_plugmap.set(value, other)
      return fn.call(this, other)
    })

    utils.decorate(proto, 'unplug', fn => function (value) {
      if (!this.__rxvision_id) return fn.apply(this, arguments)
      let other = this._rxv_plugmap.get(value)
      this._rxv_plugmap.delete(value)
      return fn.call(this, other)
    })
  })

  let receivers = ['log', 'onValue', 'onAny', 'onError']

  receivers.forEach(name => decorateWH(name, withHandler => fn => function () {
    let previd = this.__rxvision_id
    if (!previd) return fn.apply(this, arguments)
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: name,
      title: name,
      stack: stack,
      source: previd,
    })

    // TODO(jared): log errors, completions
    return fn.apply(
      mapit(withHandler, this, sid, 'recv'), arguments)
    /*
    return fn.apply(
      map.call(this, tracer.traceMap(sid, 'recv', this)),
      arguments)
      */
  }))

}

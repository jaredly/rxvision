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
    if ('function' !== typeof obs.withHandler) {
      throw new Error("Trynig to wrap something that's not an observable")
    }
    return withHandler.call(obs, (emitter, evt) => {
      if (evt.type === 'value' || evt.type === 'error') {
        evt.value = tracer.trace(sid, type, null, evt.value, evt.type)
      } else {
        evt.value = tracer.trace(sid, type, null, null, evt.type)
      }
      emitter.emitEvent(evt)
    })
  }

  function maptrace(withHandler, obs, sid) {
    if ('function' !== typeof obs.withHandler) {
      throw new Error("Trynig to wrap something that's not an observable")
    }
    return withHandler.call(obs, (emitter, evt) => {
      if (evt.type === 'value' || evt.type === 'error') {
        evt.value = tracer.trace(sid, 'recv', null, evt.value, evt.type)
        if (evt.type === 'value') {
          evt.value = mapit(withHandler, evt.value, sid, 'recv')
        }
      } else {
        evt.value = tracer.trace(sid, 'recv', null, null, evt.type)
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

  let passThrough = ['take', 'toProperty']

  passThrough.forEach(name => decorateWH(name, _ => fn => function () {
    let res = fn.apply(this, arguments)
    if (this.__rxvision_id) {
      res.__rxvision_id = this.__rxvision_id
      if (streambag) streambag.add(res)
    }
    return res
  }))

  /*
  let oneSource = ['skip', 'skipWhile', 'skipDuplicates', 'takeWhile', 'filter', 'timestamp', 'not', 'pluck', 'invoke', 'map', 'mapTo', 'selectBy', 'combine', 'merge', 'flatMap', 'flatMapLatest', 'flatMapConcat', 'flatMapFirst', 'flatMapConcurLimit']
  */
  let twoSources = Object.keys(require('../tests/kefir/two-sources.json'))

  let oneSource = Object.keys(require('../tests/kefir/one-source.json'))

  let multSources = Object.keys(require('../tests/kefir/multiple-sources.json'))

  let multTwoAlias = ['combine', 'and', 'or', 'zip', 'merge', 'concat']

  oneSource.concat(twoSources).concat(multSources).forEach(name => decorateWH(name, withHandler => fn => function () {
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

    if (twoSources.indexOf(name) !== -1 || multTwoAlias.indexOf(name) !== -1) {
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
    }

    let flatting = name.indexOf('flatMap') === 0

    if (flatting) {
      let mapper = args[0]
      if (typeof args[0] === 'function') {
        args[0] = function () {
          let full = arguments[0]
          arguments[0] = arguments[0].value
          let childObs = mapper.apply(this, arguments)
          if (childObs.__rxvision_id) {
            tracer.trace(childObs.__rxvision_id, 'recv', full)
          }
          return mapit(withHandler, childObs, sid, 'recv')
        }
      } else {
        flatting = false
      }
    }

    let interm

    if (name.indexOf('flatMap') === 0 && !flatting) {
      interm = fn.apply(
        maptrace(withHandler, this, sid),
        args
      )
    } else {
      interm = fn.apply(
        flatting ? this : mapit(withHandler, this, sid, 'recv'),
        args
      )
    }

    let obs = mapit(
      withHandler,
      interm,
      sid,
      'send'
    )

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
    repeat: false,
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

  let modargs = {
    repeat(args) {
      let ofn = args[0]
      args[0] = function () {
        let res = ofn.apply(this, arguments)
        // debugger
        if (res) return mapit(sWH, res, this.__rxvision_id, 'recv')
        return res
      }
    }
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
    let args = [].slice.call(arguments)
    if (modargs[name]) {
      modargs[name](args)
    }
    let orig = fn.apply(this, args)
    orig.__rxvision_id = sid
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

  let multiCreate = ['and', 'or', 'zip', 'merge', 'concat']

  multiCreate.forEach(name => utils.decorate(Kefir, name, fn => function (obs) {
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

    let args = [].slice.call(arguments)
    args[0] = args[0].map(obs => mapit(sWH, obs, sid, 'recv'))
    // TODO transform args
    let res = mapit(sWH, fn.apply(this, args), sid, 'send')
    res.__rxvision_id = sid;
    return res
  }))

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
    let em  = fn.apply(this, arguments)
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
    return fn.call(this, value)
  })

  utils.decorate(Kefir.Emitter.prototype, 'emit', fn => function (value) {
    if (!this.__rxvision_id) return fn.apply(this, arguments)
    value = tracer.trace(this.__rxvision_id, 'send', this, value)
    return fn.call(this, value)
  })

  utils.decorate(Kefir.Bus.prototype, 'emit', fn => function (value) {
    if (!this.__rxvision_id) return fn.apply(this, arguments)
    value = tracer.trace(this.__rxvision_id, 'send', this, value)
    return fn.call(this, value)
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

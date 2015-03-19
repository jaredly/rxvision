
import {ACTIVE, DEACTIVE} from './consts'
import wrap from '../wrap/kefir'
import Tracer from '../lib/tracer'
import Viz from '../viz/main'

export default function run(tcase, outnode, timeout, done) {
  require('kefir')
  // TODO can we have a mode that doesn't highjack the stuff in-place?
  let key = require.resolve('kefir')
  let old = require.cache[key]
  delete require.cache[key]
  let Kefir = require('kefir')
  require.cache[key] = old

  let tracer = new Tracer({
    filterFiles: ['webpack:///./wrap', 'webpack:///./~', 'webpack:///./lib'],
  })
  console.log(Kefir.Stream.prototype.map)
  let streams = new Set()
  wrap(Kefir, tracer, streams)

  let viz = new Viz(outnode)
  tracer.config.onValue = debounce(_ => {
    viz.process({streams: tracer.streams, groups: tracer.agroups})
  }, 100)

  let tid = setTimeout(_ => {
    tracer.running = false
    tid = null
    streams.forEach(source => source._clear())
    done(true)
  }, timeout)

  tracer.config.onDeactivate = _ => {
    if (!tid) return
    clearTimeout(tid)
    tid = null
    done()
  }

  tcase.it(Kefir)
  return tracer
}

function debounce(fn, time) {
  let last = null
  let tout = null
  return function check() {
    if (last === null || time < Date.now() - last) {
      clearTimeout(tout)
      last = Date.now()
      fn.call(this, arguments)
    } else {
      tout = setTimeout(check, time)
    }
  }
}



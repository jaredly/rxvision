'use strict'

import wrap from '../wrap/kefir'
import Tracer from '..'

function main() {
  if (!window.Kefir) {
    console.warn('global Kefir not found!')
    return
  }

  let tracer = new Tracer({
    filterFiles: ['kefir.js', 'kefirvision.js'],
    onValue: function (entry, id) {
      // console.log('rxvision', entry.type, entry.value, id, entry)
    }
  })
  wrap(window.Kefir, tracer)
  window.__rxvision_tracer = tracer

  window.txDump = function () {
    var t = document.createElement('textarea')
    t.value = JSON.stringify(tracer.dump())
    document.body.appendChild(t)
  }
}


main()

'use strict'

import wrap from '../wrap/rx'
import Tracer from '..'

function main() {
  if (!window.Rx) {
    console.warn('global Rx not found!')
    return
  }

  let tracer = new Tracer({
    filterFiles: ['rx.all.js', 'rxvision.js'],
    onValue: function (entry, id) {
      console.log('rxvision', entry.type, entry.value, id, entry)
    }
  })
  wrap(window.Rx, tracer)
  window.__rxvision_tracer = tracer

  window.txDump = function () {
    var t = document.createElement('textarea')
    t.value = JSON.stringify(tracer.dump())
    document.body.appendChild(t)
  }
}


main()

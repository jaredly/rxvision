'use strict'

import Viz from '../viz/main'
import data from './test-data.json'

function main() {
  //if (!window.__rxvision_tracer) {
    //return console.warn('RxVision tracer not found')
  //}

  let div = document.createElement('div')
  document.body.appendChild(div)

  let viz = new Viz(div)
  viz.process(data)
}

main()


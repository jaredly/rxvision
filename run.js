
import React from 'react'

import data from './data'
import {pointed, settle, showPoints} from './viz'

let {groups, posmap} = pointed(data, 900, 600, 25, 80)

// get things settled
for (var i=0; i<200; i++) {
  if (!settle(groups, posmap)) break
}

let node = showPoints(groups, posmap, 900, 600, 25)
let div = document.createElement('div')
document.body.appendChild(div)

React.render(node, div)



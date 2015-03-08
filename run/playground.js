'use strict'

import React from 'react'
import Playground from '../playground'

function getGist(id, done) {
  let url = `https://gist.githubusercontent.com/${id}/raw/`
  let xhr = new XMLHttpRequest()
  xhr.open('get', url)
  xhr.addEventListener('load', function () {
    done(null, xhr.responseText)
  })
  xhr.addEventListener('error', function (error) {
    done(error)
  })
  xhr.send()
}

let node = document.getElementById('playground')
if (window.location.search) {
  getGist(window.location.search.slice(1), (err, data) => {
    if (err) return React.render(<Playground/>, node)
    React.render(<Playground js={data}/>, node)
  })
} else {
  React.render(<Playground/>, node)
}


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

let ex_js = `\
let btn = $('button')[0]
let clicks = Rx.Observable.fromEvent(btn, 'click').share()
clicks.subscribe(value => console.log('clicked!'))

let values = clicks.map(() => Math.floor(Math.random() * 10 + 2))
// let values = randoms.merge(Rx.Observable.fromArray([4,5,6]))
let less1 = values.map(value => value - 1)
let times2 = less1.map(value => value*2)

times2.subscribe(value => console.log('i got a value', value))
times2.subscribe(value => console.log('also subscribing', value))
values.subscribe(value => console.log('the original was', value))
`;

let exNode = document.querySelector('#example[type="text/example"]')
if (exNode) {
  ex_js = exNode.innerHTML
}

let node = document.getElementById('playground')
if (window.location.search) {
  getGist(window.location.search.slice(1), (err, data) => {
    if (err) return React.render(<Playground/>, node)
    React.render(<Playground js={data}/>, node)
  })
} else {
  React.render(<Playground js={ex_js}/>, node)
}


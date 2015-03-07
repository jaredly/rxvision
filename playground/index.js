'use strict'

import React from 'react'
import CodeMirrorRx from './codemirror-rx'
import Viz from '../viz/main'

let babel = require('babel')

function execute(code, document, console) {
  let alert = val => console.log('[alert]', val)
  let $ = sel => document.querySelectorAll(sel)
  let window = {document, console, alert, $}
  eval(code)
}

function translate(code) {
  return babel.transform(code).code.slice('"use strict";\n'.length)
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

let ex_js = `\
let btn = $('button')[0]
let clicks = Rx.Observable.fromEvent(btn, 'click')
clicks.subscribe(value => console.log('clicked!'))

let randoms = clicks.map(() => Math.floor(Math.random() * 10 + 2))
let values = randoms.merge(Rx.Observable.fromArray([4,5,6]))
let less1 = values.map(value => value - 1)
let times2 = less1.map(value => value*2)

times2.subscribe(value => console.log('i got a value', value))
times2.subscribe(value => console.log('also subscribing', value))
values.subscribe(value => console.log('the original was', value))
`;

var cmProps = {
  style: {},
  indentWidth: 2,
  indentWithTabs: false,
  matchBrackets: true,
  lineNumbers: true,
  tabSize: 2,
  foldGutter: true,
  lineWrapping: true,
  viewportMargin: Infinity,
  gutters: ['CodeMirror-linenumbers'],
}

export default React.createClass({
  getInitialState() {
    return {
      html: '<button>Click me</button>',
      js: ex_js,
      output: []
    }
  },

  componentDidMount() {
    this.run()
  },

  run() {
    if (this.viz) {
      this.viz.teardown()
    }
    let tracer = window.__rxvision_tracer
    if (tracer) {
      let viz = this.viz = new Viz(this.refs.viz.getDOMNode())
      tracer.reset()
      tracer.config.onValue = debounce(() => {
        viz.process({streams: tracer.streams, groups: tracer.agroups})
      }, 100)
    }

    this.setState({output: []})

    let output = []
    let addLog = (type, values) => output.push({type, values})

    let logger = {
      log: (...values) => addLog('log', values),
      warn: (...values) => addLog('warn', values),
      error: (...values) => addLog('error', values),
    }

    let outNode = this.refs.output.getDOMNode()
    outNode.innerHTML = this.state.html

    let code = translate(this.state.js)
    try {
      execute.call(null, code, outNode, logger)
    } catch (e) {
      logger.error(e)
    }

    this.setState({output})

    addLog = (type, values) => this.setState({
      output: this.state.output.concat({type, values})
    })

  },

  render() {
    return <div className='Playground'>
      <div className='Playground_panes'>
        <div className='left-side'>
          <CodeMirrorRx
            ref="html"
            mode='htmlmixed'
            smartIndent={false}
            value={this.state.html}
            onBlur={this.props.onBlur}
            goDown={() => this.refs.less.focus()}
            onChange={val => this.setState({html: val})} {...cmProps}/>
          <CodeMirrorRx
            ref="js"
            mode='javascript'
            smartIndent={false}
            value={this.state.js}
            onBlur={this.props.onBlur}
            goDown={() => this.refs.less.focus()}
            onChange={val => this.setState({js: val})} {...cmProps}/>
          <button className='Playground_run' onClick={this.run}>Run</button>
        </div>
        <div className='right-side'>
          <div className='output' ref="output"></div>
          <div className='log'>
            {this.state.output.map(({values, type}) => <div className={'log-item log-type-' + type}>
              {values.map(value => <span>{showValue(value)}</span>)}
            </div>)}
          </div>
        </div>
      </div>
      <div className='viz' ref="viz"/>
    </div>
  }
})

function showValue(value) {
  if (value instanceof Error) {
    return <div className='Error'>
      <span className='Error_type'>{value.constructor.name}</span>
      <span className='Error_message'>{value.message}</span>
      <pre className='Error_stack'>{value.stack}</pre>
    </div>
  }
  if ('string' === typeof value) return value
  try {
    return JSON.stringify(value)
  } catch (e) {}
  try {
    return '' + value
  } catch (e) {}
  return <em>Unable to display value</em>
}

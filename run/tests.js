
import React from 'react'
import run from '../tests'
import tests from '../tests/kefir'

import deepEqual from 'deep-equal'

function fnBody(fn) {
  let text = fn + ''
  return text.split('\n').slice(2, -1).join('\n')
}

function toStringable(s) {
  if (s.type === 'value') s = s.value
  else if (s.type === 'end') return '*end*'
  try {
    return JSON.stringify(s)
  } catch (e) {}
  try {
    return s + ''
  } catch (e) {}
  return 'Not viewable'
}


function showLogs(logs) {
  return '[' + logs.map(toStringable).join(', ') + ']'
}

function checkLogs(logs, correct) {
  let ovals = logs.map(evt => ({type: evt.etype, value: evt.value}))
  let err = ''
  if (logs.length !== correct.length) {
    err += `Different number of events: ${logs.length} expected ${correct.length}\n`
  } else {
    for (let i=0; i<ovals.length; i++) {
      if (!deepEqual(correct[i], ovals[i])) {
        err += 'Expected (' + i + ') ' + toStringable(ovals[i]) + ' to be ' + toStringable(correct[i]) + '\n'
      }
    }
  }
  if (!err.length) return 'Passed! ' + showLogs(correct)
  return err + '\nGot: ' + showLogs(ovals) + '\nExpected: ' + showLogs(correct)
}

if (window.location.search.length > 1) {
  tests = tests.filter(tcase => tcase.title === window.location.search.slice(1))
}

window.tracers = {}

let TestCase = React.createClass({
  getInitialState() {
    return {
      status: 'unstarted',
      timeout: null
    }
  },
  componentDidMount() {
    if (!this.checkVisible()) {
      window.addEventListener('scroll', this.handleScroll)
    }
  },
  handleScroll(e) {
    if (this.checkVisible()) {
      window.removeEventListener('scroll', this.handleScroll)
    }
  },
  checkVisible() {
    if (this.state.status !== 'unstarted') return
    let node = this.refs.viz.getDOMNode()
    let top = node.getBoundingClientRect().top

    if (top > 0 && top < window.innerHeight) {
      window.removeEventListener('scroll', this.handleScroll)
      this.run()
      return true
    }
    return false
  },
  run() {
    if (this.state.status === 'running') return console.warn('already running')
    this.setState({status: 'running'}, _ => {
      let node = this.refs.viz.getDOMNode()
      ;[].forEach.call(node.childNodes, n => node.removeChild(n))
      setTimeout(_ => {
        let tracer = run(this.props.tcase, node, 5000, (error, logs) => {
          this.setState({
            logs: logs,
            result: checkLogs(logs[0].values, this.props.tcase.logs),
            status: error === true ? 'timeout' : (error ? 'error' : 'done'),
            error: error,
          })
        })
        window.tracers[this.props.tcase.title] = tracer
      }, 100)
    })
  },
  renderStatus() {
    if (this.state.status === 'error') {
      return 'Error! ' + this.state.error.message
    }
    return this.state.status
  },
  render() {
    return <div>
      <h4><a href={'?' + this.props.tcase.title}>{this.props.tcase.title}</a></h4>
      <pre>{fnBody(this.props.tcase.it)}</pre>
      <div ref="viz" className="TestViz"/>
      <div className='TestStatus'>
        {this.renderStatus()}
        {this.state.status !== 'running' && <button onClick={this.run}>Run</button>}
      </div>
      <pre>{this.props.tcase.events}</pre>
      <pre>{this.state.result}</pre>
    </div>
  }
})

let parent = document.createElement('div')
document.body.appendChild(parent)

React.render(
  <div className='Main'>
    {tests.map(tcase => <TestCase tcase={tcase}/>)}
  </div>, parent)


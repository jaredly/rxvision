
import React from 'react'
import run from '../tests'
import tests from '../tests/kefir'

function fnBody(fn) {
  let text = fn + ''
  return text.split('\n').slice(2, -1).join('\n')
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
        let tracer = run(this.props.tcase, node, 5000, error => {
          this.setState({
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
    </div>
  }
})

let parent = document.createElement('div')
document.body.appendChild(parent)

React.render(
  <div className='Main'>
    {tests.map(tcase => <TestCase tcase={tcase}/>)}
  </div>, parent)


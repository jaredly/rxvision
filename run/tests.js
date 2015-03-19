
import React from 'react'
import run from '../tests'
import tests from '../tests/kefir'

function fnBody(fn) {
  let text = fn + ''
  return text.split('\n').slice(1, -1).join('\n')
}

if (window.location.search.length > 1) {
  tests = tests.filter(tcase => tcase.title === window.location.search.slice(1))
}

window.tracers = {}

let TestCase = React.createClass({
  getInitialState() {
    return {done: false, timeout: null}
  },
  componentDidMount() {
    let tracer = run(this.props.tcase, this.refs.viz.getDOMNode(), 1000, timeout => {
      this.setState({done: true, timeout: timeout})
    })
    window.tracers[this.props.tcase.title] = tracer
  },
  render() {
    return <div>
      <h4><a href={'?' + this.props.tcase.title}>{this.props.tcase.title}</a></h4>
      <pre>{fnBody(this.props.tcase.it)}</pre>
      <div ref="viz" className="TestViz"/>
      <div className='TestStatus'>
        {this.state.done ?
          (this.state.timeout ? 'Timeout' : 'Done')
            : 'Running'}
      </div>
    </div>
  }
})

let parent = document.createElement('div')
document.body.appendChild(parent)

React.render(
  <div className='Main'>
    {tests.map(tcase => <TestCase tcase={tcase}/>)}
  </div>, parent)


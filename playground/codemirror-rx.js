
var React = require('react')
  , PT = React.PropTypes
  , CodeMirror = require('codemirror')

require('codemirror/mode/javascript/javascript')
require('codemirror/mode/htmlmixed/htmlmixed')
require('codemirror/mode/css/css')

require('codemirror/addon/edit/closebrackets')
require('codemirror/addon/edit/matchbrackets')


function px(val) {
  if ('number' === typeof val) return val + 'px'
  return val
}

function reactStyle(node, style) {
  var nopx = 'opacity,z-index,zIndex'.split(',')
  for (var name in style) {
    if (nopx.indexOf(name) !== -1) {
      node.style[name] = style[name]
    } else {
      node.style[name] = px(style[name])
    }
  }
}

var CodeMirrorRx = React.createClass({
  propTypes: {
    onChange: PT.func,
    onFocus: PT.func,
  },

  getDefaultProps: function () {
    return {
      mode: 'javascript',
    }
  },

  componentDidMount: function () {
    this._cm = new CodeMirror(this.getDOMNode(), this.props)
    this._cm.on('keydown', this.onKeyDown)
    this._cm.on('change', doc => this.isMounted() &&
                                 this.props.onChange &&
                                 this.props.onChange(doc.getValue()))
    this._cm.on('focus', () => {
      if (!this.isMounted()) return
      if (this.props.onFocus && this.props.blurred) this.props.onFocus()
    })
    this._cm.on('blur', () => {
      this.isMounted() && this.props.onBlur && this.props.onBlur()
    })
    var node = this._cm.getWrapperElement()
    if (this.props.style) {
      reactStyle(node, this.props.style)
      this._cm.refresh()
    }
    setTimeout(() => this._cm.refresh(), 1000)
  },

  componentDidUpdate: function (prevProps) {
    var same = true
    for (var name in this.props) {
      if (this.props[name] !== prevProps[name]) {
        if (name === 'value' && this._cm.getValue() === this.props[name]) continue
        this._cm.setOption(name, this.props[name] || '')
      }
    }
    var node = this._cm.getWrapperElement()
    if (this.props.style) {
      reactStyle(node, this.props.style)
      this._cm.refresh()
    }
  },

  onFocus: function () {
    if (this.props.blurred && this.props.onFocus) {
      this.props.onFocus()
    }
  },

  onKeyDown: function (editor, e) {
    if (!this.isMounted()) return
    if (this.props.blurred && this.props.onFocus) {
      this.props.onFocus()
    }
    if (editor.state.completionActive && e.keyCode !== 27) {
      e.stopPropagation()
      return
    }
    if (e.keyCode === 9) return e.stopPropagation()
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      return
    }
    if (e.keyCode === 38) { // up
      // if (editor.getCursor().line === 0) {
      var curs = editor.getCursor()
      if (curs.line === 0 && curs.ch === 0) {
        return this.props.goUp && this.props.goUp()
      }
    } else if (e.keyCode === 37) { // left
      var curs = editor.getCursor()
      if (curs.line === 0 && curs.ch === 0) {
        return this.props.goUp && this.props.goUp()
      }
    } else if (e.keyCode === 40) { // down
      // if (editor.getCursor().line === editor.lineCount() - 1) {
      var curs = editor.getCursor()
      if (curs.line === editor.lineCount() - 1 && curs.ch === editor.getLine(curs.line).length) {
        return this.props.goDown && this.props.goDown()
      }
    } else if (e.keyCode === 39) { // right
      var curs = editor.getCursor()
      if (curs.line === editor.lineCount() - 1 && curs.ch === editor.getLine(curs.line).length) {
        return this.props.goDown && this.props.goDown(true)
      }
    }
  },

  focus: function () {
    this._cm.focus()
  },

  isFocused: function () {
    return this._cm.hasFocus()
  },

  render: function () {
    return <div className='CodeMirrorRx'/>
  }
})

module.exports = CodeMirrorRx

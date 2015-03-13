(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/jared/clone/rxvision/lib/utils.js":[function(require,module,exports){
"use strict";

module.exports = {
  decorate: function decorate(obj, attr, decorator) {
    obj[attr] = decorator(obj[attr]);
  },
  asString: function asString(value) {
    try {
      return JSON.stringify(value) + "";
    } catch (e) {}
    try {
      return value + "";
    } catch (e) {}
    return "value cannot be previewed";
  }
};

},{}],"/home/jared/clone/rxvision/playground/codemirror-rx.js":[function(require,module,exports){
"use strict";

var React = require("react"),
    PT = React.PropTypes,
    CodeMirror = require("codemirror");

require("codemirror/mode/javascript/javascript");
require("codemirror/mode/htmlmixed/htmlmixed");
require("codemirror/mode/css/css");

require("codemirror/addon/edit/closebrackets");
require("codemirror/addon/edit/matchbrackets");

function px(val) {
  if ("number" === typeof val) {
    return val + "px";
  }return val;
}

function reactStyle(node, style) {
  var nopx = "opacity,z-index,zIndex".split(",");
  for (var name in style) {
    if (nopx.indexOf(name) !== -1) {
      node.style[name] = style[name];
    } else {
      node.style[name] = px(style[name]);
    }
  }
}

var CodeMirrorRx = React.createClass({
  displayName: "CodeMirrorRx",

  propTypes: {
    onChange: PT.func,
    onFocus: PT.func },

  getDefaultProps: function getDefaultProps() {
    return {
      mode: "javascript" };
  },

  componentDidMount: function componentDidMount() {
    var _this = this;

    this._cm = new CodeMirror(this.getDOMNode(), this.props);
    this._cm.on("keydown", this.onKeyDown);
    this._cm.on("change", function (doc) {
      return _this.isMounted() && _this.props.onChange && _this.props.onChange(doc.getValue());
    });
    this._cm.on("focus", function () {
      if (!_this.isMounted()) return;
      if (_this.props.onFocus && _this.props.blurred) _this.props.onFocus();
    });
    this._cm.on("blur", function () {
      _this.isMounted() && _this.props.onBlur && _this.props.onBlur();
    });
    var node = this._cm.getWrapperElement();
    if (this.props.style) {
      reactStyle(node, this.props.style);
      this._cm.refresh();
    }
    setTimeout(function () {
      return _this._cm.refresh();
    }, 1000);
  },

  componentDidUpdate: function componentDidUpdate(prevProps) {
    var same = true;
    for (var name in this.props) {
      if (this.props[name] !== prevProps[name]) {
        if (name === "value" && this._cm.getValue() === this.props[name]) continue;
        this._cm.setOption(name, this.props[name] || "");
      }
    }
    var node = this._cm.getWrapperElement();
    if (this.props.style) {
      reactStyle(node, this.props.style);
      this._cm.refresh();
    }
  },

  onFocus: function onFocus() {
    if (this.props.blurred && this.props.onFocus) {
      this.props.onFocus();
    }
  },

  onKeyDown: function onKeyDown(editor, e) {
    if (!this.isMounted()) {
      return;
    }if (this.props.blurred && this.props.onFocus) {
      this.props.onFocus();
    }
    if (editor.state.completionActive && e.keyCode !== 27) {
      e.stopPropagation();
      return;
    }
    if (e.keyCode === 9) {
      return e.stopPropagation();
    }if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }
    if (e.keyCode === 38) {
      // up
      // if (editor.getCursor().line === 0) {
      var curs = editor.getCursor();
      if (curs.line === 0 && curs.ch === 0) {
        return this.props.goUp && this.props.goUp();
      }
    } else if (e.keyCode === 37) {
      // left
      var curs = editor.getCursor();
      if (curs.line === 0 && curs.ch === 0) {
        return this.props.goUp && this.props.goUp();
      }
    } else if (e.keyCode === 40) {
      // down
      // if (editor.getCursor().line === editor.lineCount() - 1) {
      var curs = editor.getCursor();
      if (curs.line === editor.lineCount() - 1 && curs.ch === editor.getLine(curs.line).length) {
        return this.props.goDown && this.props.goDown();
      }
    } else if (e.keyCode === 39) {
      // right
      var curs = editor.getCursor();
      if (curs.line === editor.lineCount() - 1 && curs.ch === editor.getLine(curs.line).length) {
        return this.props.goDown && this.props.goDown(true);
      }
    }
  },

  focus: function focus() {
    this._cm.focus();
  },

  isFocused: function isFocused() {
    return this._cm.hasFocus();
  },

  render: function render() {
    return React.createElement("div", { className: "CodeMirrorRx" });
  }
});

module.exports = CodeMirrorRx;

},{"codemirror":"codemirror","codemirror/addon/edit/closebrackets":"codemirror/addon/edit/closebrackets","codemirror/addon/edit/matchbrackets":"codemirror/addon/edit/matchbrackets","codemirror/mode/css/css":"codemirror/mode/css/css","codemirror/mode/htmlmixed/htmlmixed":"codemirror/mode/htmlmixed/htmlmixed","codemirror/mode/javascript/javascript":"codemirror/mode/javascript/javascript","react":"react"}],"/home/jared/clone/rxvision/playground/index.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = _interopRequire(require("react"));

var CodeMirrorRx = _interopRequire(require("./codemirror-rx"));

var Viz = _interopRequire(require("../viz/main"));

var babel = require("babel");

function execute(code, document, console) {
  var alert = function (val) {
    return console.log("[alert]", val);
  };
  var $ = function (sel) {
    return document.querySelectorAll(sel);
  };
  var window = { document: document, console: console, alert: alert, $: $ };
  eval(code);
}

function translate(code) {
  return babel.transform(code).code.slice("\"use strict\";\n".length);
}

function debounce(fn, time) {
  var last = null;
  var tout = null;
  return function check() {
    if (last === null || time < Date.now() - last) {
      clearTimeout(tout);
      last = Date.now();
      fn.call(this, arguments);
    } else {
      tout = setTimeout(check, time);
    }
  };
}

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
  gutters: ["CodeMirror-linenumbers"] };

module.exports = React.createClass({
  displayName: "index",

  getInitialState: function getInitialState() {
    return {
      html: "<button>Click me</button>",
      js: this.props.js || "console.log(\"Hello!\")",
      output: []
    };
  },

  componentDidMount: function componentDidMount() {
    var _this = this;

    this._old_log = window.console.log;
    window.console.log = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _this.setState({
        output: _this.state.output.concat([{
          type: "log", values: args
        }])
      });
    };
    this.run();
  },

  run: function run() {
    var _this = this;

    if (this.viz) {
      this.viz.teardown();
    }
    var tracer = window.__rxvision_tracer;
    if (tracer) {
      (function () {
        var viz = _this.viz = new Viz(_this.refs.viz.getDOMNode());
        tracer.reset();
        tracer.config.onValue = debounce(function () {
          viz.process({ streams: tracer.streams, groups: tracer.agroups });
        }, 100);
      })();
    }

    this.setState({ output: [] });

    var output = [];
    var addLog = function (type, values) {
      return output.push({ type: type, values: values });
    };

    var logger = {
      log: function () {
        for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
          values[_key] = arguments[_key];
        }

        return addLog("log", values);
      },
      warn: function () {
        for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
          values[_key] = arguments[_key];
        }

        return addLog("warn", values);
      },
      error: function () {
        for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
          values[_key] = arguments[_key];
        }

        return addLog("error", values);
      } };

    var outNode = this.refs.output.getDOMNode();
    outNode.innerHTML = this.state.html;

    var code = translate(this.state.js);
    try {
      execute.call(null, code, outNode, logger);
    } catch (e) {
      logger.error(e);
    }

    this.setState({ output: output });

    addLog = function (type, values) {
      return _this.setState({
        output: _this.state.output.concat({ type: type, values: values })
      });
    };
  },

  render: function render() {
    var _this = this;

    return React.createElement(
      "div",
      { className: "Playground" },
      React.createElement(
        "div",
        { className: "Playground_panes" },
        React.createElement(
          "div",
          { className: "left-side" },
          React.createElement(CodeMirrorRx, _extends({
            ref: "html",
            mode: "htmlmixed",
            smartIndent: false,
            value: this.state.html,
            onBlur: this.props.onBlur,
            goDown: function () {
              return _this.refs.less.focus();
            },
            onChange: function (val) {
              return _this.setState({ html: val });
            } }, cmProps)),
          React.createElement(CodeMirrorRx, _extends({
            ref: "js",
            mode: "javascript",
            smartIndent: false,
            value: this.state.js,
            onBlur: this.props.onBlur,
            goDown: function () {
              return _this.refs.less.focus();
            },
            onChange: function (val) {
              return _this.setState({ js: val });
            } }, cmProps)),
          React.createElement(
            "button",
            { className: "Playground_run", onClick: this.run },
            "Run"
          )
        ),
        React.createElement(
          "div",
          { className: "right-side" },
          React.createElement("div", { className: "output", ref: "output" }),
          React.createElement(
            "div",
            { className: "log" },
            this.state.output.map(function (_ref) {
              var values = _ref.values;
              var type = _ref.type;
              return React.createElement(
                "div",
                { className: "log-item log-type-" + type },
                values.map(function (value) {
                  return React.createElement(
                    "span",
                    null,
                    showValue(value)
                  );
                })
              );
            })
          )
        )
      ),
      React.createElement("div", { className: "viz", ref: "viz" })
    );
  }
});

function showValue(value) {
  if (value instanceof Error) {
    return React.createElement(
      "div",
      { className: "Error" },
      React.createElement(
        "span",
        { className: "Error_type" },
        value.constructor.name
      ),
      React.createElement(
        "span",
        { className: "Error_message" },
        value.message
      ),
      React.createElement(
        "pre",
        { className: "Error_stack" },
        value.stack
      )
    );
  }
  if ("string" === typeof value) {
    return value;
  }try {
    return JSON.stringify(value);
  } catch (e) {}
  try {
    return "" + value;
  } catch (e) {}
  return React.createElement(
    "em",
    null,
    "Unable to display value"
  );
}

},{"../viz/main":"/home/jared/clone/rxvision/viz/main.js","./codemirror-rx":"/home/jared/clone/rxvision/playground/codemirror-rx.js","babel":"babel","react":"react"}],"/home/jared/clone/rxvision/run/playground.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var React = _interopRequire(require("react"));

var Playground = _interopRequire(require("../playground"));

function getGist(id, done) {
  var url = "https://gist.githubusercontent.com/" + id + "/raw/";
  var xhr = new XMLHttpRequest();
  xhr.open("get", url);
  xhr.addEventListener("load", function () {
    done(null, xhr.responseText);
  });
  xhr.addEventListener("error", function (error) {
    done(error);
  });
  xhr.send();
}

var ex_js = "let btn = $('button')[0]\nlet clicks = Rx.Observable.fromEvent(btn, 'click').share()\nclicks.subscribe(value => console.log('clicked!'))\n\nlet values = clicks.map(() => Math.floor(Math.random() * 10 + 2))\n// let values = randoms.merge(Rx.Observable.fromArray([4,5,6]))\nlet less1 = values.map(value => value - 1)\nlet times2 = less1.map(value => value*2)\n\ntimes2.subscribe(value => console.log('i got a value', value))\ntimes2.subscribe(value => console.log('also subscribing', value))\nvalues.subscribe(value => console.log('the original was', value))\n";

var exNode = document.querySelector("#example[type=\"text/example\"]");
if (exNode) {
  ex_js = exNode.innerHTML;
}

var node = document.getElementById("playground");
if (window.location.search) {
  getGist(window.location.search.slice(1), function (err, data) {
    if (err) return React.render(React.createElement(Playground, null), node);
    React.render(React.createElement(Playground, { js: data }), node);
  });
} else {
  React.render(React.createElement(Playground, { js: ex_js }), node);
}

},{"../playground":"/home/jared/clone/rxvision/playground/index.js","react":"react"}],"/home/jared/clone/rxvision/viz/main.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var utils = _interopRequire(require("./utils"));

var Tip = _interopRequire(require("./tip"));

var asString = require("../lib/utils").asString;

var Viz = (function () {
  function Viz(node) {
    _classCallCheck(this, Viz);

    this.setup(node);
  }

  _prototypeProperties(Viz, null, {
    teardown: {
      value: function teardown() {
        this.div.remove();
      },
      writable: true,
      configurable: true
    },
    setup: {
      value: function setup(node) {
        this.config = {
          crad: 5,
          cmar: 5,
          margin: 40,
          width: 1500,
          leftBarWidth: 150
        };

        var crad = this.config.crad;
        var cmar = this.config.cmar;
        var margin = this.config.margin;
        var leftBarWidth = this.config.leftBarWidth;

        var height = 10 * (crad * 2 + cmar) - cmar + margin * 2;
        var div = this.div = d3.select(node).append("div").attr("class", "rxvision");
        var svg = div.append("svg").attr("width", this.config.width).attr("height", height);
        var mainGroup = svg.append("g");
        var groups = {};

        var groupNames = "backs,ticks,lines,streams".split(",");
        groupNames.forEach(function (name) {
          return groups[name] = mainGroup.append("g").attr("class", name);
        });

        groups.swimLines = groups.lines.append("g").attr("class", "swim-lines");
        groups.dataLinesBack = groups.lines.append("g").attr("class", "data-lines-back");
        groups.dataLines = groups.lines.append("g").attr("class", "data-lines");

        mainGroup.attr("transform", "translate(" + (margin + leftBarWidth) + ", " + margin + ")");

        var leftBarGroup = svg.append("g").attr("class", "left-bar");

        this.tip = new Tip(div);
        this.svg = svg;
        this.groups = groups;
        this.leftBarGroup = leftBarGroup;
      },
      writable: true,
      configurable: true
    },
    process: {
      value: function process(data, isSanitized) {
        var _utils$processData = utils.processData(data);

        var streams = _utils$processData.streams;
        var posMap = _utils$processData.posMap;
        var sids = _utils$processData.sids;

        var crad = this.config.crad;
        var cmar = this.config.cmar;
        var margin = this.config.margin;
        var width = this.config.width - this.config.leftBarWidth - margin * 2;

        var height = streams.length * (crad * 2 + cmar) - cmar + margin * 2;
        var yscale = (height - margin * 2) / streams.length;

        this.svg.attr("height", height);

        var timeDiff = data.groups[data.groups.length - 1].start - data.groups[0].start;
        var totalWidth = data.groups.reduce(function (w, g) {
          return w + g.width;
        }, 0);
        var circleWidth = totalWidth * (crad * 2 + cmar) - cmar;
        /*
        let flexWidth = 499 // width - circleWidth
        if (flexWidth < 500) {
          flexWidth = 500
          width = flexWidth + circleWidth + margin*2 + this.config.leftBarWidth
          this.config.width = width
          this.svg.attr('width', width)
        }
        */
        var timeScale = 0.01;
        var flexWidth = timeScale * timeDiff;
        // let timeScale = flexWidth / timeDiff

        width = flexWidth + circleWidth + margin * 2 + this.config.leftBarWidth;
        this.config.width = width;
        this.svg.attr("width", width);

        var starts = utils.getStarts(data.groups, timeScale, crad, cmar);
        this.isSanitized = isSanitized;

        this.veryStart = data.groups[0].start;

        this.ysid = function (sid) {
          return sids.indexOf(sid) * yscale + crad;
        };

        this.x = function (gid, xoff) {
          var off = (xoff + 1) * (crad * 2 + cmar) - cmar - crad;
          return starts[gid] + off;
        };

        var dataLines = utils.getDataLines(posMap, this.x, this.ysid);

        // ok make things
        this.makeLeftBar(streams);
        this.makeBacks(data.groups, height);
        this.makeStreams(streams, posMap);
        this.makeSwimLines(sids, data.streams);
        this.makeDataLines(dataLines);
      },
      writable: true,
      configurable: true
    },
    showValueTip: {
      value: function showValueTip(x, value) {
        var margin = this.config.margin;
        var y = this.ysid(value.sid) + margin + 30;
        x += this.config.leftBarWidth + margin + 10;
        var text = "Value: " + (this.isSanitized ? value : asString(value.value)).slice(0, 50) + "\n" + (value.ts - this.veryStart) / 1000 + "s\n";
        this.tip.show(x, y, text);
      },
      writable: true,
      configurable: true
    },
    makeLeftBar: {
      value: function makeLeftBar(streams) {
        var _this = this;

        // Make the Left Bar

        var crad = this.config.crad;
        var cmar = this.config.cmar;
        var margin = this.config.margin;
        var leftBarWidth = this.config.leftBarWidth;

        var labels = this.leftBarGroup.selectAll("g.label").data(streams);
        var labelsE = labels.enter().append("g").attr("class", function (d) {
          return "label " + d.type;
        }).on("mouseover", function (d) {
          return _this.tip.show(leftBarWidth, _this.ysid(d.id) + margin, utils.readStack(d.stack));
        }).on("mouseout", function () {
          return _this.tip.hide();
        });

        labelsE.append("circle").attr("cx", leftBarWidth - margin).attr("cy", 0).attr("r", crad);

        labelsE.append("text").attr("x", 0).attr("y", 0).text(function (d) {
          return d.title + " [" + d.type + "]";
        }).attr("text-anchor", "end").attr("x", leftBarWidth - margin - crad - cmar).text(function (d) {
          return d.title;
        });

        labels.attr("transform", function (d) {
          return "translate(" + margin + ", " + (margin + _this.ysid(d.id)) + ")";
        });

        labels.exit().remove();
      },
      writable: true,
      configurable: true
    },
    makeBacks: {
      value: function makeBacks(groups, height) {
        var _this = this;

        var _config = this.config;
        var crad = _config.crad;
        var cmar = _config.cmar;
        var margin = _config.margin;

        var backs = this.groups.backs.selectAll("rect").data(groups);
        backs.enter().append("rect");
        backs.attr("x", function (d, i) {
          return _this.x(i, 0) - crad;
        }).attr("width", function (d) {
          return d.width * (crad * 2 + cmar) - cmar;
        }).attr("y", -margin / 2).attr("height", height - margin);
        backs.exit().remove();
      },
      writable: true,
      configurable: true
    },
    makeSwimLines: {
      value: function makeSwimLines(sids, streamMap) {
        var _this = this;

        var _config = this.config;
        var margin = _config.margin;
        var width = _config.width;

        var swimLines = this.groups.swimLines.selectAll("path").data(sids);
        swimLines.enter().append("path");
        swimLines.attr("d", function (d) {
          return "M " + -margin + " " + _this.ysid(d) + " L " + width + " " + _this.ysid(d);
        }).attr("class", function (d) {
          return streamMap[d].type;
        });
        swimLines.exit().remove();
      },
      writable: true,
      configurable: true
    },
    makeDataLines: {
      value: function makeDataLines(dataLines) {
        var _this = this;

        var tweenback = this.groups.dataLinesBack.selectAll("path").data(dataLines);
        tweenback.enter().append("path").on("mouseover", function (d) {
          _this.groups.streams.selectAll(".uid-" + d.uid + ",.from-" + d.uid).classed("active", true);
          _this.groups.lines.selectAll(".uid-" + d.uid).classed("active", true);
        }).on("mouseout", function (d) {
          _this.groups.streams.selectAll(".uid-" + d.uid + ",.from-" + d.uid).classed("active", false);
          _this.groups.lines.selectAll(".uid-" + d.uid).classed("active", false);
        });
        tweenback.attr("class", function (d) {
          return "uid-" + d.uid;
        }).attr("d", function (d) {
          return "M " + d.from.x + " " + d.from.y + " L " + d.to.x + " " + d.to.y;
        });
        tweenback.exit().remove();

        var tweenlines = this.groups.dataLines.selectAll("path").data(dataLines);
        tweenlines.enter().append("path");
        tweenlines.attr("class", function (d) {
          return "uid-" + d.uid;
        }).attr("d", function (d) {
          return "M " + d.from.x + " " + d.from.y + " L " + d.to.x + " " + d.to.y;
        });
        tweenlines.exit().remove();
      },
      writable: true,
      configurable: true
    },
    makeStreams: {
      value: function makeStreams(streams, posMap) {
        var _this = this;

        var ssel = this.groups.streams.selectAll("g.stream").data(streams);
        ssel.enter().append("g").attr("class", "stream");
        ssel.attr("transform", function (d) {
          return "translate(0, " + _this.ysid(d.id) + ")";
        });
        var makeDots = this.makeDots.bind(this);
        ssel.each(function (d) {
          makeDots(posMap, d, this);
        });
        ssel.exit().remove();
      },
      writable: true,
      configurable: true
    },
    makeDots: {
      value: function makeDots(posMap, stream, node) {
        var _this = this;

        var crad = this.config.crad;
        var cmar = this.config.cmar;

        var dot = d3.select(node).selectAll("g.dot").data(stream.type === "subscribe" ? stream.values : stream.values.filter(function (v) {
          return v.type !== "recv" || !posMap[v.uid].to.length || posMap[v.uid].toAsync;
        }));
        var entered = dot.enter().append("g").attr("class", function (d) {
          return "dot uid-" + d.uid + (d.type === "send" ? " from-" + posMap[d.uid].from : "");
        }, true).on("mouseover", function (d) {
          _this.showValueTip(_this.x(d.agroup, d.xpos), d);

          _this.groups.streams.selectAll(".uid-" + d.uid + ",.from-" + d.uid).classed("active", true);
          _this.groups.lines.selectAll(".uid-" + d.uid).classed("active", true);
          var from = posMap[d.uid].from;
          if (from && d.type !== "recv") {
            _this.groups.streams.selectAll(".uid-" + from).classed("active", true);
            _this.groups.lines.selectAll(".uid-" + from).classed("active", true);
          }
        }).on("mouseout", function (d) {
          _this.tip.hide();

          _this.groups.streams.selectAll(".uid-" + d.uid + ",.from-" + d.uid).classed("active", false);
          _this.groups.lines.selectAll(".uid-" + d.uid).classed("active", false);
          var from = posMap[d.uid].from;
          if (from && d.type !== "recv") {
            _this.groups.streams.selectAll(".uid-" + from).classed("active", false);
            _this.groups.lines.selectAll(".uid-" + from).classed("active", false);
          }
        });

        dot.attr("transform", function (d) {
          return "translate(" + _this.x(d.agroup, d.xpos) + ", 0)";
        }).classed({
          start: function (d) {
            return !posMap[d.uid].from && d.type === "send";
          },
          end: function (d) {
            return stream.type === "subscribe" || d.type === "recv" && !posMap[d.uid].to.length;
          },
          recv: function (d) {
            return d.type === "recv";
          } });

        var backCircle = entered.append("circle").attr("class", "back").attr("cx", 0).attr("cy", 0);
        var circle = entered.append("circle").attr("class", "front").attr("cx", 0).attr("cy", 0);

        dot.select("circle.front").attr("r", function (d) {
          var pm = posMap[d.uid];
          if (stream.type === "subscribe") return crad;
          if (d.type === "send" && (!pm.from || !pm.ends.length)) return crad;
          if (d.type === "recv" && !pm.to.length) return crad;
          if (d.type === "recv" && !pm.sourced) return crad;
          return crad / 2;
        });
        dot.select("circle.back").attr("r", function (d) {
          var pm = posMap[d.uid];
          if (stream.type === "subscribe") return crad * 1.5;
          if (d.type === "send" && (!pm.from || !pm.ends.length)) return crad * 1.5;
          if (d.type === "recv" && !pm.to.length) return crad * 1.5;
          if (d.type === "recv" && !pm.sourced) return crad * 1.5;
          return crad;
        });

        dot.exit().remove();
      },
      writable: true,
      configurable: true
    }
  });

  return Viz;
})();

module.exports = Viz;

},{"../lib/utils":"/home/jared/clone/rxvision/lib/utils.js","./tip":"/home/jared/clone/rxvision/viz/tip.js","./utils":"/home/jared/clone/rxvision/viz/utils.js"}],"/home/jared/clone/rxvision/viz/tip.js":[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Tip = (function () {
  function Tip(node) {
    _classCallCheck(this, Tip);

    this.node = node.append("div").attr("class", "tip");
  }

  _prototypeProperties(Tip, null, {
    hide: {
      value: function hide() {
        this.node.style("opacity", "0");
      },
      writable: true,
      configurable: true
    },
    show: {
      value: function show(x, y, text) {
        this.node.style("top", y + "px").style("left", x + "px").style("opacity", "1").text(text);
      },
      writable: true,
      configurable: true
    }
  });

  return Tip;
})();

module.exports = Tip;

},{}],"/home/jared/clone/rxvision/viz/utils.js":[function(require,module,exports){
"use strict";

module.exports = { readStack: readStack, processData: processData, getStarts: getStarts, getDataLines: getDataLines };

function getPosMap(streams) {
  var posMap = {};
  streams.forEach(function (stream) {
    var from = null;
    stream.values.forEach(function (value) {
      if (value.type !== "recv") {
        posMap[value.uid] = {
          sid: value.sid,
          xpos: value.xpos,
          async: value.async,
          agroup: value.agroup,
          from: from,
          toAsync: posMap[value.uid] ? posMap[value.uid].toAsync : false,
          to: posMap[value.uid] ? posMap[value.uid].to : [],
          sourced: true,
          ends: posMap[value.uid] ? posMap[value.uid].ends : []
        };
        if (posMap[from]) {
          posMap[from].to.push(value.uid);
          if (value.async || value.agroup !== posMap[from].agroup || value.xpos !== posMap[from].xpos) {
            posMap[from].toAsync = true;
          }
        }
      } else if (value.type === "recv") {
        if (!posMap[value.uid]) {
          posMap[value.uid] = { ends: [], to: [], sourced: false };
        }
        from = value.uid;
        posMap[value.uid].ends.push({
          sid: value.sid,
          xpos: value.xpos,
          agroup: value.agroup });
      }
    });
  });
  return posMap;
}

function settlePos(posMap, sids) {
  var changed = false;
  Object.keys(posMap).forEach(function (uid) {
    var pm = posMap[uid];
    pm.ends.forEach(function (end) {
      if (sids.indexOf(end.sid) < sids.indexOf(pm.sid)) {
        sids.splice(sids.indexOf(end.sid), 1);
        sids.splice(sids.indexOf(pm.sid) + 1, 0, end.sid);
        changed = true;
      }
    });
  });
  return changed;
}

function getStarts(groups, timeScale, crad, cmar) {
  var starts = [],
      last = 0,
      lstart = groups[0].start;
  groups.forEach(function (group) {
    last += (group.start - lstart) * timeScale;
    starts.push(last);
    lstart = group.start;
    last += group.width * (crad * 2 + cmar) - cmar;
  });

  return starts;
}

function getDataLines(posMap, x, ysid) {
  var dataLines = [];
  Object.keys(posMap).forEach(function (uid) {
    var _posMap$uid = posMap[uid];
    var ends = _posMap$uid.ends;
    var agroup = _posMap$uid.agroup;
    var xpos = _posMap$uid.xpos;
    var sid = _posMap$uid.sid;

    ends.forEach(function (dest) {
      dataLines.push({
        id: uid,
        uid: uid,
        from: {
          y: ysid(sid),
          x: x(agroup, xpos) },
        to: {
          y: ysid(dest.sid),
          x: x(dest.agroup, dest.xpos) }
      });
    });
  });
  return dataLines;
}

function processData(data) {
  var streams = Object.keys(data.streams).map(function (id) {
    return data.streams[id];
  });
  var sids = streams.map(function (s) {
    return s.id;
  });

  var posMap = getPosMap(streams);

  for (var i = 0; i < 100; i++) {
    if (!settlePos(posMap, sids)) break;
  }

  return { streams: streams, posMap: posMap, sids: sids };
}

function readStack(stack) {
  var parts = stack.trim().split(/ /g);
  parts.shift(); // 'at'
  var name = "(main)";
  if (parts.length === 2) {
    // in a function
    name = parts.shift();
    parts[0] = parts[0].slice(1, -1);
  }
  if (parts[0] === "eval") {
    name = "eval";
    parts = parts.slice(-1);
    parts[0] = parts[0].slice(0, -1);
  }
  var finfo = parts[0].split("/").slice(-1)[0].split(":");
  return name + " " + finfo[0] + (" (" + finfo.slice(1).join(":") + ")");
}

},{}]},{},["/home/jared/clone/rxvision/run/playground.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdjAuMTAuMzMvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vbGliL3V0aWxzLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vcGxheWdyb3VuZC9jb2RlbWlycm9yLXJ4LmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vcGxheWdyb3VuZC9pbmRleC5qcyIsIi9ob21lL2phcmVkL2Nsb25lL3J4dmlzaW9uL3J1bi9wbGF5Z3JvdW5kLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vdml6L21haW4uanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi92aXovdGlwLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vdml6L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7aUJDRWU7QUFDYixVQUFRLEVBQUEsa0JBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7QUFDN0IsT0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtHQUNqQztBQUNELFVBQVEsRUFBQSxrQkFBQyxLQUFLLEVBQUU7QUFDZCxRQUFJO0FBQUMsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQTtLQUFDLENBQ3ZDLE9BQU0sQ0FBQyxFQUFDLEVBQUU7QUFDVixRQUFJO0FBQUMsYUFBTyxLQUFLLEdBQUMsRUFBRSxDQUFBO0tBQUMsQ0FDckIsT0FBTSxDQUFDLEVBQUMsRUFBRTtBQUNWLFdBQU8sMkJBQTJCLENBQUE7R0FDbkM7Q0FDRjs7Ozs7QUNaRCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ3hCLEVB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QUMsV0FBUSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBRyxDQUFBO0NBQ2hFIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGRlY29yYXRlKG9iaiwgYXR0ciwgZGVjb3JhdG9yKSB7XG4gICAgb2JqW2F0dHJdID0gZGVjb3JhdG9yKG9ialthdHRyXSlcbiAgfSxcbiAgYXNTdHJpbmcodmFsdWUpIHtcbiAgICB0cnkge3JldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgKyAnJ31cbiAgICBjYXRjaChlKXt9XG4gICAgdHJ5IHtyZXR1cm4gdmFsdWUrJyd9XG4gICAgY2F0Y2goZSl7fVxuICAgIHJldHVybiAndmFsdWUgY2Fubm90IGJlIHByZXZpZXdlZCdcbiAgfVxufVxuXG4iLCJcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JylcbiAgLCBQVCA9IFJlYWN0LlByb3BUeXBlc1xuICAsIENvZGVNaXJyb3IgPSByZXF1aXJlKCdjb2RlbWlycm9yJylcblxucmVxdWlyZSgnY29kZW1pcnJvci9tb2RlL2phdmFzY3JpcHQvamF2YXNjcmlwdCcpXG5yZXF1aXJlKCdjb2RlbWlycm9yL21vZGUvaHRtbG1peGVkL2h0bWxtaXhlZCcpXG5yZXF1aXJlKCdjb2RlbWlycm9yL21vZGUvY3NzL2NzcycpXG5cbnJlcXVpcmUoJ2NvZGVtaXJyb3IvYWRkb24vZWRpdC9jbG9zZWJyYWNrZXRzJylcbnJlcXVpcmUoJ2NvZGVtaXJyb3IvYWRkb24vZWRpdC9tYXRjaGJyYWNrZXRzJylcblxuXG5mdW5jdGlvbiBweCh2YWwpIHtcbiAgaWYgKCdudW1iZXInID09PSB0eXBlb2YgdmFsKSByZXR1cm4gdmFsICsgJ3B4J1xuICByZXR1cm4gdmFsXG59XG5cbmZ1bmN0aW9uIHJlYWN0U3R5bGUobm9kZSwgc3R5bGUpIHtcbiAgdmFyIG5vcHggPSAnb3BhY2l0eSx6LWluZGV4LHpJbmRleCcuc3BsaXQoJywnKVxuICBmb3IgKHZhciBuYW1lIGluIHN0eWxlKSB7XG4gICAgaWYgKG5vcHguaW5kZXhPZihuYW1lKSAhPT0gLTEpIHtcbiAgICAgIG5vZGUuc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXVxuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLnN0eWxlW25hbWVdID0gcHgoc3R5bGVbbmFtZV0pXG4gICAgfVxuICB9XG59XG5cbnZhciBDb2RlTWlycm9yUnggPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIG9uQ2hhbmdlOiBQVC5mdW5jLFxuICAgIG9uRm9jdXM6IFBULmZ1bmMsXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1vZGU6ICdqYXZhc2NyaXB0JyxcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jbSA9IG5ldyBDb2RlTWlycm9yKHRoaXMuZ2V0RE9NTm9kZSgpLCB0aGlzLnByb3BzKVxuICAgIHRoaXMuX2NtLm9uKCdrZXlkb3duJywgdGhpcy5vbktleURvd24pXG4gICAgdGhpcy5fY20ub24oJ2NoYW5nZScsIGRvYyA9PiB0aGlzLmlzTW91bnRlZCgpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKGRvYy5nZXRWYWx1ZSgpKSlcbiAgICB0aGlzLl9jbS5vbignZm9jdXMnLCAoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHJldHVyblxuICAgICAgaWYgKHRoaXMucHJvcHMub25Gb2N1cyAmJiB0aGlzLnByb3BzLmJsdXJyZWQpIHRoaXMucHJvcHMub25Gb2N1cygpXG4gICAgfSlcbiAgICB0aGlzLl9jbS5vbignYmx1cicsICgpID0+IHtcbiAgICAgIHRoaXMuaXNNb3VudGVkKCkgJiYgdGhpcy5wcm9wcy5vbkJsdXIgJiYgdGhpcy5wcm9wcy5vbkJsdXIoKVxuICAgIH0pXG4gICAgdmFyIG5vZGUgPSB0aGlzLl9jbS5nZXRXcmFwcGVyRWxlbWVudCgpXG4gICAgaWYgKHRoaXMucHJvcHMuc3R5bGUpIHtcbiAgICAgIHJlYWN0U3R5bGUobm9kZSwgdGhpcy5wcm9wcy5zdHlsZSlcbiAgICAgIHRoaXMuX2NtLnJlZnJlc2goKVxuICAgIH1cbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2NtLnJlZnJlc2goKSwgMTAwMClcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMpIHtcbiAgICB2YXIgc2FtZSA9IHRydWVcbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMucHJvcHMpIHtcbiAgICAgIGlmICh0aGlzLnByb3BzW25hbWVdICE9PSBwcmV2UHJvcHNbbmFtZV0pIHtcbiAgICAgICAgaWYgKG5hbWUgPT09ICd2YWx1ZScgJiYgdGhpcy5fY20uZ2V0VmFsdWUoKSA9PT0gdGhpcy5wcm9wc1tuYW1lXSkgY29udGludWVcbiAgICAgICAgdGhpcy5fY20uc2V0T3B0aW9uKG5hbWUsIHRoaXMucHJvcHNbbmFtZV0gfHwgJycpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBub2RlID0gdGhpcy5fY20uZ2V0V3JhcHBlckVsZW1lbnQoKVxuICAgIGlmICh0aGlzLnByb3BzLnN0eWxlKSB7XG4gICAgICByZWFjdFN0eWxlKG5vZGUsIHRoaXMucHJvcHMuc3R5bGUpXG4gICAgICB0aGlzLl9jbS5yZWZyZXNoKClcbiAgICB9XG4gIH0sXG5cbiAgb25Gb2N1czogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLmJsdXJyZWQgJiYgdGhpcy5wcm9wcy5vbkZvY3VzKSB7XG4gICAgICB0aGlzLnByb3BzLm9uRm9jdXMoKVxuICAgIH1cbiAgfSxcblxuICBvbktleURvd246IGZ1bmN0aW9uIChlZGl0b3IsIGUpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHJldHVyblxuICAgIGlmICh0aGlzLnByb3BzLmJsdXJyZWQgJiYgdGhpcy5wcm9wcy5vbkZvY3VzKSB7XG4gICAgICB0aGlzLnByb3BzLm9uRm9jdXMoKVxuICAgIH1cbiAgICBpZiAoZWRpdG9yLnN0YXRlLmNvbXBsZXRpb25BY3RpdmUgJiYgZS5rZXlDb2RlICE9PSAyNykge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChlLmtleUNvZGUgPT09IDkpIHJldHVybiBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgaWYgKGUuc2hpZnRLZXkgfHwgZS5jdHJsS2V5IHx8IGUuYWx0S2V5IHx8IGUubWV0YUtleSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChlLmtleUNvZGUgPT09IDM4KSB7IC8vIHVwXG4gICAgICAvLyBpZiAoZWRpdG9yLmdldEN1cnNvcigpLmxpbmUgPT09IDApIHtcbiAgICAgIHZhciBjdXJzID0gZWRpdG9yLmdldEN1cnNvcigpXG4gICAgICBpZiAoY3Vycy5saW5lID09PSAwICYmIGN1cnMuY2ggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZ29VcCAmJiB0aGlzLnByb3BzLmdvVXAoKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09PSAzNykgeyAvLyBsZWZ0XG4gICAgICB2YXIgY3VycyA9IGVkaXRvci5nZXRDdXJzb3IoKVxuICAgICAgaWYgKGN1cnMubGluZSA9PT0gMCAmJiBjdXJzLmNoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BzLmdvVXAgJiYgdGhpcy5wcm9wcy5nb1VwKClcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gNDApIHsgLy8gZG93blxuICAgICAgLy8gaWYgKGVkaXRvci5nZXRDdXJzb3IoKS5saW5lID09PSBlZGl0b3IubGluZUNvdW50KCkgLSAxKSB7XG4gICAgICB2YXIgY3VycyA9IGVkaXRvci5nZXRDdXJzb3IoKVxuICAgICAgaWYgKGN1cnMubGluZSA9PT0gZWRpdG9yLmxpbmVDb3VudCgpIC0gMSAmJiBjdXJzLmNoID09PSBlZGl0b3IuZ2V0TGluZShjdXJzLmxpbmUpLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wcy5nb0Rvd24gJiYgdGhpcy5wcm9wcy5nb0Rvd24oKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09PSAzOSkgeyAvLyByaWdodFxuICAgICAgdmFyIGN1cnMgPSBlZGl0b3IuZ2V0Q3Vyc29yKClcbiAgICAgIGlmIChjdXJzLmxpbmUgPT09IGVkaXRvci5saW5lQ291bnQoKSAtIDEgJiYgY3Vycy5jaCA9PT0gZWRpdG9yLmdldExpbmUoY3Vycy5saW5lKS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZ29Eb3duICYmIHRoaXMucHJvcHMuZ29Eb3duKHRydWUpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGZvY3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fY20uZm9jdXMoKVxuICB9LFxuXG4gIGlzRm9jdXNlZDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9jbS5oYXNGb2N1cygpXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdDb2RlTWlycm9yUngnLz5cbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBDb2RlTWlycm9yUnhcbiIsIid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgQ29kZU1pcnJvclJ4IGZyb20gJy4vY29kZW1pcnJvci1yeCdcbmltcG9ydCBWaXogZnJvbSAnLi4vdml6L21haW4nXG5cbmxldCBiYWJlbCA9IHJlcXVpcmUoJ2JhYmVsJylcblxuZnVuY3Rpb24gZXhlY3V0ZShjb2RlLCBkb2N1bWVudCwgY29uc29sZSkge1xuICBsZXQgYWxlcnQgPSB2YWwgPT4gY29uc29sZS5sb2coJ1thbGVydF0nLCB2YWwpXG4gIGxldCAkID0gc2VsID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKVxuICBsZXQgd2luZG93ID0ge2RvY3VtZW50LCBjb25zb2xlLCBhbGVydCwgJH1cbiAgZXZhbChjb2RlKVxufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGUoY29kZSkge1xuICByZXR1cm4gYmFiZWwudHJhbnNmb3JtKGNvZGUpLmNvZGUuc2xpY2UoJ1widXNlIHN0cmljdFwiO1xcbicubGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBkZWJvdW5jZShmbiwgdGltZSkge1xuICBsZXQgbGFzdCA9IG51bGxcbiAgbGV0IHRvdXQgPSBudWxsXG4gIHJldHVybiBmdW5jdGlvbiBjaGVjaygpIHtcbiAgICBpZiAobGFzdCA9PT0gbnVsbCB8fCB0aW1lIDwgRGF0ZS5ub3coKSAtIGxhc3QpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0b3V0KVxuICAgICAgbGFzdCA9IERhdGUubm93KClcbiAgICAgIGZuLmNhbGwodGhpcywgYXJndW1lbnRzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0b3V0ID0gc2V0VGltZW91dChjaGVjaywgdGltZSlcbiAgICB9XG4gIH1cbn1cblxudmFyIGNtUHJvcHMgPSB7XG4gIHN0eWxlOiB7fSxcbiAgaW5kZW50V2lkdGg6IDIsXG4gIGluZGVudFdpdGhUYWJzOiBmYWxzZSxcbiAgbWF0Y2hCcmFja2V0czogdHJ1ZSxcbiAgbGluZU51bWJlcnM6IHRydWUsXG4gIHRhYlNpemU6IDIsXG4gIGZvbGRHdXR0ZXI6IHRydWUsXG4gIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgdmlld3BvcnRNYXJnaW46IEluZmluaXR5LFxuICBndXR0ZXJzOiBbJ0NvZGVNaXJyb3ItbGluZW51bWJlcnMnXSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGh0bWw6ICc8YnV0dG9uPkNsaWNrIG1lPC9idXR0b24+JyxcbiAgICAgIGpzOiB0aGlzLnByb3BzLmpzIHx8ICdjb25zb2xlLmxvZyhcIkhlbGxvIVwiKScsXG4gICAgICBvdXRwdXQ6IFtdXG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuX29sZF9sb2cgPSB3aW5kb3cuY29uc29sZS5sb2dcbiAgICB3aW5kb3cuY29uc29sZS5sb2cgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIG91dHB1dDogdGhpcy5zdGF0ZS5vdXRwdXQuY29uY2F0KFt7XG4gICAgICAgICAgdHlwZTogJ2xvZycsIHZhbHVlczogYXJnc1xuICAgICAgICB9XSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHRoaXMucnVuKClcbiAgfSxcblxuICBydW4oKSB7XG4gICAgaWYgKHRoaXMudml6KSB7XG4gICAgICB0aGlzLnZpei50ZWFyZG93bigpXG4gICAgfVxuICAgIGxldCB0cmFjZXIgPSB3aW5kb3cuX19yeHZpc2lvbl90cmFjZXJcbiAgICBpZiAodHJhY2VyKSB7XG4gICAgICBsZXQgdml6ID0gdGhpcy52aXogPSBuZXcgVml6KHRoaXMucmVmcy52aXouZ2V0RE9NTm9kZSgpKVxuICAgICAgdHJhY2VyLnJlc2V0KClcbiAgICAgIHRyYWNlci5jb25maWcub25WYWx1ZSA9IGRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgdml6LnByb2Nlc3Moe3N0cmVhbXM6IHRyYWNlci5zdHJlYW1zLCBncm91cHM6IHRyYWNlci5hZ3JvdXBzfSlcbiAgICAgIH0sIDEwMClcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtvdXRwdXQ6IFtdfSlcblxuICAgIGxldCBvdXRwdXQgPSBbXVxuICAgIGxldCBhZGRMb2cgPSAodHlwZSwgdmFsdWVzKSA9PiBvdXRwdXQucHVzaCh7dHlwZSwgdmFsdWVzfSlcblxuICAgIGxldCBsb2dnZXIgPSB7XG4gICAgICBsb2c6ICguLi52YWx1ZXMpID0+IGFkZExvZygnbG9nJywgdmFsdWVzKSxcbiAgICAgIHdhcm46ICguLi52YWx1ZXMpID0+IGFkZExvZygnd2FybicsIHZhbHVlcyksXG4gICAgICBlcnJvcjogKC4uLnZhbHVlcykgPT4gYWRkTG9nKCdlcnJvcicsIHZhbHVlcyksXG4gICAgfVxuXG4gICAgbGV0IG91dE5vZGUgPSB0aGlzLnJlZnMub3V0cHV0LmdldERPTU5vZGUoKVxuICAgIG91dE5vZGUuaW5uZXJIVE1MID0gdGhpcy5zdGF0ZS5odG1sXG5cbiAgICBsZXQgY29kZSA9IHRyYW5zbGF0ZSh0aGlzLnN0YXRlLmpzKVxuICAgIHRyeSB7XG4gICAgICBleGVjdXRlLmNhbGwobnVsbCwgY29kZSwgb3V0Tm9kZSwgbG9nZ2VyKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihlKVxuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe291dHB1dH0pXG5cbiAgICBhZGRMb2cgPSAodHlwZSwgdmFsdWVzKSA9PiB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG91dHB1dDogdGhpcy5zdGF0ZS5vdXRwdXQuY29uY2F0KHt0eXBlLCB2YWx1ZXN9KVxuICAgIH0pXG5cbiAgfSxcblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdQbGF5Z3JvdW5kJz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdQbGF5Z3JvdW5kX3BhbmVzJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xlZnQtc2lkZSc+XG4gICAgICAgICAgPENvZGVNaXJyb3JSeFxuICAgICAgICAgICAgcmVmPVwiaHRtbFwiXG4gICAgICAgICAgICBtb2RlPSdodG1sbWl4ZWQnXG4gICAgICAgICAgICBzbWFydEluZGVudD17ZmFsc2V9XG4gICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS5odG1sfVxuICAgICAgICAgICAgb25CbHVyPXt0aGlzLnByb3BzLm9uQmx1cn1cbiAgICAgICAgICAgIGdvRG93bj17KCkgPT4gdGhpcy5yZWZzLmxlc3MuZm9jdXMoKX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt2YWwgPT4gdGhpcy5zZXRTdGF0ZSh7aHRtbDogdmFsfSl9IHsuLi5jbVByb3BzfS8+XG4gICAgICAgICAgPENvZGVNaXJyb3JSeFxuICAgICAgICAgICAgcmVmPVwianNcIlxuICAgICAgICAgICAgbW9kZT0namF2YXNjcmlwdCdcbiAgICAgICAgICAgIHNtYXJ0SW5kZW50PXtmYWxzZX1cbiAgICAgICAgICAgIHZhbHVlPXt0aGlzLnN0YXRlLmpzfVxuICAgICAgICAgICAgb25CbHVyPXt0aGlzLnByb3BzLm9uQmx1cn1cbiAgICAgICAgICAgIGdvRG93bj17KCkgPT4gdGhpcy5yZWZzLmxlc3MuZm9jdXMoKX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXt2YWwgPT4gdGhpcy5zZXRTdGF0ZSh7anM6IHZhbH0pfSB7Li4uY21Qcm9wc30vPlxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdQbGF5Z3JvdW5kX3J1bicgb25DbGljaz17dGhpcy5ydW59PlJ1bjwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J3JpZ2h0LXNpZGUnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdvdXRwdXQnIHJlZj1cIm91dHB1dFwiPjwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsb2cnPlxuICAgICAgICAgICAge3RoaXMuc3RhdGUub3V0cHV0Lm1hcCgoe3ZhbHVlcywgdHlwZX0pID0+IDxkaXYgY2xhc3NOYW1lPXsnbG9nLWl0ZW0gbG9nLXR5cGUtJyArIHR5cGV9PlxuICAgICAgICAgICAgICB7dmFsdWVzLm1hcCh2YWx1ZSA9PiA8c3Bhbj57c2hvd1ZhbHVlKHZhbHVlKX08L3NwYW4+KX1cbiAgICAgICAgICAgIDwvZGl2Pil9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0ndml6JyByZWY9XCJ2aXpcIi8+XG4gICAgPC9kaXY+XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIHNob3dWYWx1ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nRXJyb3InPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdFcnJvcl90eXBlJz57dmFsdWUuY29uc3RydWN0b3IubmFtZX08L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J0Vycm9yX21lc3NhZ2UnPnt2YWx1ZS5tZXNzYWdlfTwvc3Bhbj5cbiAgICAgIDxwcmUgY2xhc3NOYW1lPSdFcnJvcl9zdGFjayc+e3ZhbHVlLnN0YWNrfTwvcHJlPlxuICAgIDwvZGl2PlxuICB9XG4gIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHZhbHVlKSByZXR1cm4gdmFsdWVcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpXG4gIH0gY2F0Y2ggKGUpIHt9XG4gIHRyeSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWVcbiAgfSBjYXRjaCAoZSkge31cbiAgcmV0dXJuIDxlbT5VbmFibGUgdG8gZGlzcGxheSB2YWx1ZTwvZW0+XG59XG4iLCIndXNlIHN0cmljdCdcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFBsYXlncm91bmQgZnJvbSAnLi4vcGxheWdyb3VuZCdcblxuZnVuY3Rpb24gZ2V0R2lzdChpZCwgZG9uZSkge1xuICBsZXQgdXJsID0gYGh0dHBzOi8vZ2lzdC5naXRodWJ1c2VyY29udGVudC5jb20vJHtpZH0vcmF3L2BcbiAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG4gIHhoci5vcGVuKCdnZXQnLCB1cmwpXG4gIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgIGRvbmUobnVsbCwgeGhyLnJlc3BvbnNlVGV4dClcbiAgfSlcbiAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgZG9uZShlcnJvcilcbiAgfSlcbiAgeGhyLnNlbmQoKVxufVxuXG5sZXQgZXhfanMgPSBgXFxcbmxldCBidG4gPSAkKCdidXR0b24nKVswXVxubGV0IGNsaWNrcyA9IFJ4Lk9ic2VydmFibGUuZnJvbUV2ZW50KGJ0biwgJ2NsaWNrJykuc2hhcmUoKVxuY2xpY2tzLnN1YnNjcmliZSh2YWx1ZSA9PiBjb25zb2xlLmxvZygnY2xpY2tlZCEnKSlcblxubGV0IHZhbHVlcyA9IGNsaWNrcy5tYXAoKCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAgKyAyKSlcbi8vIGxldCB2YWx1ZXMgPSByYW5kb21zLm1lcmdlKFJ4Lk9ic2VydmFibGUuZnJvbUFycmF5KFs0LDUsNl0pKVxubGV0IGxlc3MxID0gdmFsdWVzLm1hcCh2YWx1ZSA9PiB2YWx1ZSAtIDEpXG5sZXQgdGltZXMyID0gbGVzczEubWFwKHZhbHVlID0+IHZhbHVlKjIpXG5cbnRpbWVzMi5zdWJzY3JpYmUodmFsdWUgPT4gY29uc29sZS5sb2coJ2kgZ290IGEgdmFsdWUnLCB2YWx1ZSkpXG50aW1lczIuc3Vic2NyaWJlKHZhbHVlID0+IGNvbnNvbGUubG9nKCdhbHNvIHN1YnNjcmliaW5nJywgdmFsdWUpKVxudmFsdWVzLnN1YnNjcmliZSh2YWx1ZSA9PiBjb25zb2xlLmxvZygndGhlIG9yaWdpbmFsIHdhcycsIHZhbHVlKSlcbmA7XG5cbmxldCBleE5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXhhbXBsZVt0eXBlPVwidGV4dC9leGFtcGxlXCJdJylcbmlmIChleE5vZGUpIHtcbiAgZXhfanMgPSBleE5vZGUuaW5uZXJIVE1MXG59XG5cbmxldCBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXlncm91bmQnKVxuaWYgKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpIHtcbiAgZ2V0R2lzdCh3aW5kb3cubG9jYXRpb24uc2VhcmNoLnNsaWNlKDEpLCAoZXJyLCBkYXRhKSA9PiB7XG4gICAgaWYgKGVycikgcmV0dXJuIFJlYWN0LnJlbmRlcig8UGxheWdyb3VuZC8+LCBub2RlKVxuICAgIFJlYWN0LnJlbmRlcig8UGxheWdyb3VuZCBqcz17ZGF0YX0vPiwgbm9kZSlcbiAgfSlcbn0gZWxzZSB7XG4gIFJlYWN0LnJlbmRlcig8UGxheWdyb3VuZCBqcz17ZXhfanN9Lz4sIG5vZGUpXG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgdXRpbHMgZnJvbSAnLi91dGlscydcbmltcG9ydCBUaXAgZnJvbSAnLi90aXAnXG5pbXBvcnQge2FzU3RyaW5nfSBmcm9tICcuLi9saWIvdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZpeiB7XG4gIGNvbnN0cnVjdG9yIChub2RlKSB7XG4gICAgdGhpcy5zZXR1cChub2RlKVxuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpcy5kaXYucmVtb3ZlKClcbiAgfVxuXG4gIHNldHVwKG5vZGUpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIGNyYWQ6IDUsXG4gICAgICBjbWFyOiA1LFxuICAgICAgbWFyZ2luOiA0MCxcbiAgICAgIHdpZHRoOiAxNTAwLFxuICAgICAgbGVmdEJhcldpZHRoOiAxNTBcbiAgICB9XG5cbiAgICBsZXQgY3JhZCA9IHRoaXMuY29uZmlnLmNyYWRcbiAgICBsZXQgY21hciA9IHRoaXMuY29uZmlnLmNtYXJcbiAgICBsZXQgbWFyZ2luID0gdGhpcy5jb25maWcubWFyZ2luXG4gICAgbGV0IGxlZnRCYXJXaWR0aCA9IHRoaXMuY29uZmlnLmxlZnRCYXJXaWR0aFxuXG4gICAgbGV0IGhlaWdodCA9IDEwICogKGNyYWQgKiAyICsgY21hcikgLSBjbWFyICsgbWFyZ2luICogMlxuICAgIGxldCBkaXYgPSB0aGlzLmRpdiA9ICBkMy5zZWxlY3Qobm9kZSkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3J4dmlzaW9uJylcbiAgICBsZXQgc3ZnID0gZGl2LmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHRoaXMuY29uZmlnLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodClcbiAgICBsZXQgbWFpbkdyb3VwID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgbGV0IGdyb3VwcyA9IHt9XG5cbiAgICBsZXQgZ3JvdXBOYW1lcyA9ICdiYWNrcyx0aWNrcyxsaW5lcyxzdHJlYW1zJy5zcGxpdCgnLCcpXG4gICAgZ3JvdXBOYW1lcy5mb3JFYWNoKG5hbWUgPT4gZ3JvdXBzW25hbWVdID0gbWFpbkdyb3VwLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgbmFtZSkpXG5cbiAgICBncm91cHMuc3dpbUxpbmVzID0gZ3JvdXBzLmxpbmVzLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3N3aW0tbGluZXMnKVxuICAgIGdyb3Vwcy5kYXRhTGluZXNCYWNrID0gZ3JvdXBzLmxpbmVzLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2RhdGEtbGluZXMtYmFjaycpXG4gICAgZ3JvdXBzLmRhdGFMaW5lcyA9IGdyb3Vwcy5saW5lcy5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdkYXRhLWxpbmVzJylcblxuICAgIG1haW5Hcm91cC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7bWFyZ2luICsgbGVmdEJhcldpZHRofSwgJHttYXJnaW59KWApXG5cbiAgICBsZXQgbGVmdEJhckdyb3VwID0gc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2xlZnQtYmFyJylcblxuICAgIHRoaXMudGlwID0gbmV3IFRpcChkaXYpXG4gICAgdGhpcy5zdmcgPSBzdmdcbiAgICB0aGlzLmdyb3VwcyA9IGdyb3Vwc1xuICAgIHRoaXMubGVmdEJhckdyb3VwID0gbGVmdEJhckdyb3VwXG4gIH1cblxuICBwcm9jZXNzKGRhdGEsIGlzU2FuaXRpemVkKSB7XG4gICAgbGV0IHtzdHJlYW1zLCBwb3NNYXAsIHNpZHN9ID0gdXRpbHMucHJvY2Vzc0RhdGEoZGF0YSlcblxuICAgIGxldCBjcmFkID0gdGhpcy5jb25maWcuY3JhZFxuICAgIGxldCBjbWFyID0gdGhpcy5jb25maWcuY21hclxuICAgIGxldCBtYXJnaW4gPSB0aGlzLmNvbmZpZy5tYXJnaW5cbiAgICBsZXQgd2lkdGggPSB0aGlzLmNvbmZpZy53aWR0aCAtIHRoaXMuY29uZmlnLmxlZnRCYXJXaWR0aCAtIG1hcmdpbioyXG5cbiAgICBsZXQgaGVpZ2h0ID0gc3RyZWFtcy5sZW5ndGggKiAoY3JhZCAqIDIgKyBjbWFyKSAtIGNtYXIgKyBtYXJnaW4gKiAyXG4gICAgbGV0IHlzY2FsZSA9IChoZWlnaHQgLSBtYXJnaW4qMikgLyBzdHJlYW1zLmxlbmd0aFxuXG4gICAgdGhpcy5zdmcuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuXG4gICAgbGV0IHRpbWVEaWZmID0gZGF0YS5ncm91cHNbZGF0YS5ncm91cHMubGVuZ3RoLTFdLnN0YXJ0IC0gZGF0YS5ncm91cHNbMF0uc3RhcnRcbiAgICBsZXQgdG90YWxXaWR0aCA9IGRhdGEuZ3JvdXBzLnJlZHVjZSgodywgZykgPT4gdyArIGcud2lkdGgsIDApXG4gICAgbGV0IGNpcmNsZVdpZHRoID0gdG90YWxXaWR0aCAqIChjcmFkICogMiArIGNtYXIpIC0gY21hclxuICAgIC8qXG4gICAgbGV0IGZsZXhXaWR0aCA9IDQ5OSAvLyB3aWR0aCAtIGNpcmNsZVdpZHRoXG4gICAgaWYgKGZsZXhXaWR0aCA8IDUwMCkge1xuICAgICAgZmxleFdpZHRoID0gNTAwXG4gICAgICB3aWR0aCA9IGZsZXhXaWR0aCArIGNpcmNsZVdpZHRoICsgbWFyZ2luKjIgKyB0aGlzLmNvbmZpZy5sZWZ0QmFyV2lkdGhcbiAgICAgIHRoaXMuY29uZmlnLndpZHRoID0gd2lkdGhcbiAgICAgIHRoaXMuc3ZnLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgfVxuICAgICovXG4gICAgbGV0IHRpbWVTY2FsZSA9IC4wMVxuICAgIGxldCBmbGV4V2lkdGggPSB0aW1lU2NhbGUgKiB0aW1lRGlmZlxuICAgIC8vIGxldCB0aW1lU2NhbGUgPSBmbGV4V2lkdGggLyB0aW1lRGlmZlxuXG4gICAgICB3aWR0aCA9IGZsZXhXaWR0aCArIGNpcmNsZVdpZHRoICsgbWFyZ2luKjIgKyB0aGlzLmNvbmZpZy5sZWZ0QmFyV2lkdGhcbiAgICAgIHRoaXMuY29uZmlnLndpZHRoID0gd2lkdGhcbiAgICAgIHRoaXMuc3ZnLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG5cbiAgICBsZXQgc3RhcnRzID0gdXRpbHMuZ2V0U3RhcnRzKGRhdGEuZ3JvdXBzLCB0aW1lU2NhbGUsIGNyYWQsIGNtYXIpXG4gICAgdGhpcy5pc1Nhbml0aXplZCA9IGlzU2FuaXRpemVkXG5cbiAgICB0aGlzLnZlcnlTdGFydCA9IGRhdGEuZ3JvdXBzWzBdLnN0YXJ0XG5cbiAgICB0aGlzLnlzaWQgPSBzaWQgPT4gc2lkcy5pbmRleE9mKHNpZCkgKiB5c2NhbGUgKyBjcmFkXG5cbiAgICB0aGlzLnggPSAoZ2lkLCB4b2ZmKSA9PiB7XG4gICAgICBsZXQgb2ZmID0gKHhvZmYgKyAxKSAqIChjcmFkICogMiArIGNtYXIpIC0gY21hciAtIGNyYWRcbiAgICAgIHJldHVybiBzdGFydHNbZ2lkXSArIG9mZlxuICAgIH1cblxuICAgIGxldCBkYXRhTGluZXMgPSB1dGlscy5nZXREYXRhTGluZXMocG9zTWFwLCB0aGlzLngsIHRoaXMueXNpZClcblxuICAgIC8vIG9rIG1ha2UgdGhpbmdzXG4gICAgdGhpcy5tYWtlTGVmdEJhcihzdHJlYW1zKVxuICAgIHRoaXMubWFrZUJhY2tzKGRhdGEuZ3JvdXBzLCBoZWlnaHQpXG4gICAgdGhpcy5tYWtlU3RyZWFtcyhzdHJlYW1zLCBwb3NNYXApXG4gICAgdGhpcy5tYWtlU3dpbUxpbmVzKHNpZHMsIGRhdGEuc3RyZWFtcylcbiAgICB0aGlzLm1ha2VEYXRhTGluZXMoZGF0YUxpbmVzKVxuICB9XG5cbiAgc2hvd1ZhbHVlVGlwKHgsIHZhbHVlKSB7XG4gICAgbGV0IG1hcmdpbiA9IHRoaXMuY29uZmlnLm1hcmdpblxuICAgIGxldCB5ID0gdGhpcy55c2lkKHZhbHVlLnNpZCkgKyBtYXJnaW4gKyAzMFxuICAgIHggKz0gdGhpcy5jb25maWcubGVmdEJhcldpZHRoICsgbWFyZ2luICsgMTBcbiAgICBsZXQgdGV4dCA9ICdWYWx1ZTogJyArICh0aGlzLmlzU2FuaXRpemVkID8gdmFsdWUgOiBhc1N0cmluZyh2YWx1ZS52YWx1ZSkpLnNsaWNlKDAsIDUwKSArICdcXG4nICtcbiAgICAgICAgICAgICAgICAodmFsdWUudHMgLSB0aGlzLnZlcnlTdGFydCkvMTAwMCArICdzXFxuJ1xuICAgIHRoaXMudGlwLnNob3coeCwgeSwgdGV4dClcbiAgfVxuXG4gIG1ha2VMZWZ0QmFyKHN0cmVhbXMpIHtcbiAgICAvLyBNYWtlIHRoZSBMZWZ0IEJhclxuXG4gICAgbGV0IGNyYWQgPSB0aGlzLmNvbmZpZy5jcmFkXG4gICAgbGV0IGNtYXIgPSB0aGlzLmNvbmZpZy5jbWFyXG4gICAgbGV0IG1hcmdpbiA9IHRoaXMuY29uZmlnLm1hcmdpblxuICAgIGxldCBsZWZ0QmFyV2lkdGggPSB0aGlzLmNvbmZpZy5sZWZ0QmFyV2lkdGhcblxuICAgIGxldCBsYWJlbHMgPSB0aGlzLmxlZnRCYXJHcm91cC5zZWxlY3RBbGwoJ2cubGFiZWwnKS5kYXRhKHN0cmVhbXMpXG4gICAgbGV0IGxhYmVsc0UgPSBsYWJlbHMuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgZCA9PiBgbGFiZWwgJHtkLnR5cGV9YClcbiAgICAgIC5vbignbW91c2VvdmVyJywgZCA9PiB0aGlzLnRpcC5zaG93KGxlZnRCYXJXaWR0aCwgdGhpcy55c2lkKGQuaWQpICsgbWFyZ2luLCB1dGlscy5yZWFkU3RhY2soZC5zdGFjaykpKVxuICAgICAgLm9uKCdtb3VzZW91dCcsICgpID0+IHRoaXMudGlwLmhpZGUoKSlcblxuICAgIGxhYmVsc0UuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2N4JywgbGVmdEJhcldpZHRoIC0gbWFyZ2luKVxuICAgICAgLmF0dHIoJ2N5JywgMClcbiAgICAgIC5hdHRyKCdyJywgY3JhZClcblxuICAgIGxhYmVsc0UuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCd4JywgMClcbiAgICAgIC5hdHRyKCd5JywgMClcbiAgICAgIC50ZXh0KGQgPT4gZC50aXRsZSArICcgWycgKyBkLnR5cGUgKyAnXScpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnZW5kJylcbiAgICAgIC5hdHRyKCd4JywgbGVmdEJhcldpZHRoIC0gbWFyZ2luIC0gY3JhZCAtIGNtYXIpXG4gICAgICAudGV4dChkID0+IGQudGl0bGUpXG5cbiAgICBsYWJlbHNcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBkID0+IGB0cmFuc2xhdGUoJHttYXJnaW59LCAke21hcmdpbiArIHRoaXMueXNpZChkLmlkKX0pYClcblxuICAgIGxhYmVscy5leGl0KCkucmVtb3ZlKClcbiAgfVxuXG4gIG1ha2VCYWNrcyhncm91cHMsIGhlaWdodCkge1xuICAgIGxldCB7Y3JhZCwgY21hciwgbWFyZ2lufSA9IHRoaXMuY29uZmlnXG5cbiAgICBsZXQgYmFja3MgPSB0aGlzLmdyb3Vwcy5iYWNrc1xuICAgICAgLnNlbGVjdEFsbCgncmVjdCcpLmRhdGEoZ3JvdXBzKVxuICAgIGJhY2tzXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoJ3JlY3QnKVxuICAgIGJhY2tzXG4gICAgICAuYXR0cigneCcsIChkLCBpKSA9PiB0aGlzLngoaSwgMCkgLSBjcmFkKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZCA9PiBkLndpZHRoICogKGNyYWQgKiAyICsgY21hcikgLSBjbWFyKVxuICAgICAgLmF0dHIoJ3knLCAtbWFyZ2luLzIpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0IC0gbWFyZ2luKVxuICAgIGJhY2tzLmV4aXQoKS5yZW1vdmUoKVxuICB9XG5cbiAgbWFrZVN3aW1MaW5lcyhzaWRzLCBzdHJlYW1NYXApIHtcbiAgICBsZXQge21hcmdpbiwgd2lkdGh9ID0gdGhpcy5jb25maWdcbiAgICBsZXQgc3dpbUxpbmVzID0gdGhpcy5ncm91cHMuc3dpbUxpbmVzXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJykuZGF0YShzaWRzKVxuICAgIHN3aW1MaW5lc1xuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICBzd2ltTGluZXNcbiAgICAgIC5hdHRyKCdkJywgZCA9PiBgTSAkey1tYXJnaW59ICR7dGhpcy55c2lkKGQpfSBMICR7d2lkdGh9ICR7dGhpcy55c2lkKGQpfWApXG4gICAgICAuYXR0cignY2xhc3MnLCBkID0+IHN0cmVhbU1hcFtkXS50eXBlKVxuICAgIHN3aW1MaW5lcy5leGl0KCkucmVtb3ZlKClcbiAgfVxuXG4gIG1ha2VEYXRhTGluZXMoZGF0YUxpbmVzKSB7XG4gICAgbGV0IHR3ZWVuYmFjayA9IHRoaXMuZ3JvdXBzLmRhdGFMaW5lc0JhY2tcbiAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKS5kYXRhKGRhdGFMaW5lcylcbiAgICB0d2VlbmJhY2tcbiAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAub24oJ21vdXNlb3ZlcicsIGQgPT4ge1xuICAgICAgICB0aGlzLmdyb3Vwcy5zdHJlYW1zLnNlbGVjdEFsbCgnLnVpZC0nICsgZC51aWQgKyAnLC5mcm9tLScgKyBkLnVpZCkuY2xhc3NlZCgnYWN0aXZlJywgdHJ1ZSlcbiAgICAgICAgdGhpcy5ncm91cHMubGluZXMuc2VsZWN0QWxsKCcudWlkLScgKyBkLnVpZCkuY2xhc3NlZCgnYWN0aXZlJywgdHJ1ZSlcbiAgICAgIH0pXG4gICAgICAub24oJ21vdXNlb3V0JywgZCA9PiB7XG4gICAgICAgIHRoaXMuZ3JvdXBzLnN0cmVhbXMuc2VsZWN0QWxsKCcudWlkLScgKyBkLnVpZCArICcsLmZyb20tJyArIGQudWlkKS5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSlcbiAgICAgICAgdGhpcy5ncm91cHMubGluZXMuc2VsZWN0QWxsKCcudWlkLScgKyBkLnVpZCkuY2xhc3NlZCgnYWN0aXZlJywgZmFsc2UpXG4gICAgICB9KVxuICAgIHR3ZWVuYmFja1xuICAgICAgLmF0dHIoJ2NsYXNzJywgZCA9PiAndWlkLScgKyBkLnVpZClcbiAgICAgIC5hdHRyKCdkJywgZCA9PiBgTSAke2QuZnJvbS54fSAke2QuZnJvbS55fSBMICR7ZC50by54fSAke2QudG8ueX1gKVxuICAgIHR3ZWVuYmFjay5leGl0KCkucmVtb3ZlKClcblxuICAgIGxldCB0d2VlbmxpbmVzID0gdGhpcy5ncm91cHMuZGF0YUxpbmVzXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJykuZGF0YShkYXRhTGluZXMpXG4gICAgdHdlZW5saW5lc1xuICAgICAgLmVudGVyKCkuYXBwZW5kKCdwYXRoJylcbiAgICB0d2VlbmxpbmVzXG4gICAgICAuYXR0cignY2xhc3MnLCBkID0+ICd1aWQtJyArIGQudWlkKVxuICAgICAgLmF0dHIoJ2QnLCBkID0+IGBNICR7ZC5mcm9tLnh9ICR7ZC5mcm9tLnl9IEwgJHtkLnRvLnh9ICR7ZC50by55fWApXG4gICAgdHdlZW5saW5lcy5leGl0KCkucmVtb3ZlKClcbiAgfVxuXG4gIG1ha2VTdHJlYW1zKHN0cmVhbXMsIHBvc01hcCkge1xuICAgIGxldCBzc2VsID0gdGhpcy5ncm91cHMuc3RyZWFtcy5zZWxlY3RBbGwoJ2cuc3RyZWFtJykuZGF0YShzdHJlYW1zKVxuICAgIHNzZWwuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N0cmVhbScpXG4gICAgc3NlbFxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGQgPT4gYHRyYW5zbGF0ZSgwLCAke3RoaXMueXNpZChkLmlkKX0pYClcbiAgICBsZXQgbWFrZURvdHMgPSB0aGlzLm1ha2VEb3RzLmJpbmQodGhpcylcbiAgICBzc2VsLmVhY2goZnVuY3Rpb24gKGQpIHttYWtlRG90cyhwb3NNYXAsIGQsIHRoaXMpfSlcbiAgICBzc2VsLmV4aXQoKS5yZW1vdmUoKVxuICB9XG5cbiAgbWFrZURvdHMocG9zTWFwLCBzdHJlYW0sIG5vZGUpIHtcbiAgICBsZXQgY3JhZCA9IHRoaXMuY29uZmlnLmNyYWRcbiAgICBsZXQgY21hciA9IHRoaXMuY29uZmlnLmNtYXJcblxuICAgIHZhciBkb3QgPSBkMy5zZWxlY3Qobm9kZSkuc2VsZWN0QWxsKCdnLmRvdCcpXG4gICAgICAuZGF0YShzdHJlYW0udHlwZSA9PT0gJ3N1YnNjcmliZScgPyBzdHJlYW0udmFsdWVzIDogc3RyZWFtLnZhbHVlcy5maWx0ZXIodiA9PiB2LnR5cGUgIT09ICdyZWN2JyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcG9zTWFwW3YudWlkXS50by5sZW5ndGggfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zTWFwW3YudWlkXS50b0FzeW5jKSlcbiAgICBsZXQgZW50ZXJlZCA9IGRvdC5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBkID0+ICdkb3QgdWlkLScgKyBkLnVpZCArIChkLnR5cGUgPT09ICdzZW5kJyA/ICcgZnJvbS0nICsgcG9zTWFwW2QudWlkXS5mcm9tIDogJycpLCB0cnVlKVxuICAgICAgLm9uKCdtb3VzZW92ZXInLCBkID0+IHtcbiAgICAgICAgdGhpcy5zaG93VmFsdWVUaXAodGhpcy54KGQuYWdyb3VwLCBkLnhwb3MpLCBkKVxuXG4gICAgICAgIHRoaXMuZ3JvdXBzLnN0cmVhbXMuc2VsZWN0QWxsKCcudWlkLScgKyBkLnVpZCArICcsLmZyb20tJyArIGQudWlkKS5jbGFzc2VkKCdhY3RpdmUnLCB0cnVlKVxuICAgICAgICB0aGlzLmdyb3Vwcy5saW5lcy5zZWxlY3RBbGwoJy51aWQtJyArIGQudWlkKS5jbGFzc2VkKCdhY3RpdmUnLCB0cnVlKVxuICAgICAgICBsZXQgZnJvbSA9IHBvc01hcFtkLnVpZF0uZnJvbVxuICAgICAgICBpZiAoZnJvbSAmJiBkLnR5cGUgIT09ICdyZWN2Jykge1xuICAgICAgICAgIHRoaXMuZ3JvdXBzLnN0cmVhbXMuc2VsZWN0QWxsKCcudWlkLScgKyBmcm9tKS5jbGFzc2VkKCdhY3RpdmUnLCB0cnVlKVxuICAgICAgICAgIHRoaXMuZ3JvdXBzLmxpbmVzLnNlbGVjdEFsbCgnLnVpZC0nICsgZnJvbSkuY2xhc3NlZCgnYWN0aXZlJywgdHJ1ZSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5vbignbW91c2VvdXQnLCBkID0+IHtcbiAgICAgICAgdGhpcy50aXAuaGlkZSgpXG5cbiAgICAgICAgdGhpcy5ncm91cHMuc3RyZWFtcy5zZWxlY3RBbGwoJy51aWQtJyArIGQudWlkICsgJywuZnJvbS0nICsgZC51aWQpLmNsYXNzZWQoJ2FjdGl2ZScsIGZhbHNlKVxuICAgICAgICB0aGlzLmdyb3Vwcy5saW5lcy5zZWxlY3RBbGwoJy51aWQtJyArIGQudWlkKS5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSlcbiAgICAgICAgbGV0IGZyb20gPSBwb3NNYXBbZC51aWRdLmZyb21cbiAgICAgICAgaWYgKGZyb20gJiYgZC50eXBlICE9PSAncmVjdicpIHtcbiAgICAgICAgICB0aGlzLmdyb3Vwcy5zdHJlYW1zLnNlbGVjdEFsbCgnLnVpZC0nICsgZnJvbSkuY2xhc3NlZCgnYWN0aXZlJywgZmFsc2UpXG4gICAgICAgICAgdGhpcy5ncm91cHMubGluZXMuc2VsZWN0QWxsKCcudWlkLScgKyBmcm9tKS5jbGFzc2VkKCdhY3RpdmUnLCBmYWxzZSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIGRvdFxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGQgPT4gYHRyYW5zbGF0ZSgke3RoaXMueChkLmFncm91cCwgZC54cG9zKX0sIDApYClcbiAgICAgIC5jbGFzc2VkKHtcbiAgICAgICAgJ3N0YXJ0JzogZCA9PiAoIXBvc01hcFtkLnVpZF0uZnJvbSAmJiBkLnR5cGUgPT09ICdzZW5kJyksXG4gICAgICAgIGVuZDogZCA9PiBzdHJlYW0udHlwZSA9PT0gJ3N1YnNjcmliZScgfHwgKGQudHlwZSA9PT0gJ3JlY3YnICYmICFwb3NNYXBbZC51aWRdLnRvLmxlbmd0aCksXG4gICAgICAgIHJlY3Y6IGQgPT4gZC50eXBlID09PSAncmVjdicsXG4gICAgICB9KVxuXG4gICAgbGV0IGJhY2tDaXJjbGUgPSBlbnRlcmVkLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdiYWNrJylcbiAgICAgIC5hdHRyKCdjeCcsIDApXG4gICAgICAuYXR0cignY3knLCAwKVxuICAgIGxldCBjaXJjbGUgPSBlbnRlcmVkLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdmcm9udCcpXG4gICAgICAuYXR0cignY3gnLCAwKVxuICAgICAgLmF0dHIoJ2N5JywgMClcblxuICAgIGRvdC5zZWxlY3QoJ2NpcmNsZS5mcm9udCcpXG4gICAgICAuYXR0cigncicsIGQgPT4ge1xuICAgICAgICBsZXQgcG0gPSBwb3NNYXBbZC51aWRdXG4gICAgICAgIGlmIChzdHJlYW0udHlwZSA9PT0gJ3N1YnNjcmliZScpIHJldHVybiBjcmFkXG4gICAgICAgIGlmIChkLnR5cGUgPT09ICdzZW5kJyAmJiAoIXBtLmZyb20gfHwgIXBtLmVuZHMubGVuZ3RoKSkgcmV0dXJuIGNyYWRcbiAgICAgICAgaWYgKGQudHlwZSA9PT0gJ3JlY3YnICYmICFwbS50by5sZW5ndGgpIHJldHVybiBjcmFkXG4gICAgICAgIGlmIChkLnR5cGUgPT09ICdyZWN2JyAmJiAhcG0uc291cmNlZCkgcmV0dXJuIGNyYWRcbiAgICAgICAgcmV0dXJuIGNyYWQgLyAyXG4gICAgICB9KVxuICAgIGRvdC5zZWxlY3QoJ2NpcmNsZS5iYWNrJylcbiAgICAgIC5hdHRyKCdyJywgZCA9PiB7XG4gICAgICAgIGxldCBwbSA9IHBvc01hcFtkLnVpZF1cbiAgICAgICAgaWYgKHN0cmVhbS50eXBlID09PSAnc3Vic2NyaWJlJykgcmV0dXJuIGNyYWQgKiAxLjVcbiAgICAgICAgaWYgKGQudHlwZSA9PT0gJ3NlbmQnICYmICghcG0uZnJvbSB8fCAhcG0uZW5kcy5sZW5ndGgpKSByZXR1cm4gY3JhZCoxLjVcbiAgICAgICAgaWYgKGQudHlwZSA9PT0gJ3JlY3YnICYmICFwbS50by5sZW5ndGgpIHJldHVybiBjcmFkKjEuNVxuICAgICAgICBpZiAoZC50eXBlID09PSAncmVjdicgJiYgIXBtLnNvdXJjZWQpIHJldHVybiBjcmFkKjEuNVxuICAgICAgICByZXR1cm4gY3JhZFxuICAgICAgfSlcblxuICAgIGRvdC5leGl0KCkucmVtb3ZlKClcbiAgfVxufVxuXG4iLCIndXNlIHN0cmljdCdcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGlwIHtcbiAgY29uc3RydWN0b3Iobm9kZSkge1xuICAgIHRoaXMubm9kZSA9IG5vZGUuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICd0aXAnKVxuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLm5vZGUuc3R5bGUoJ29wYWNpdHknLCAnMCcpXG4gIH1cblxuICBzaG93KHgsIHksIHRleHQpIHtcbiAgICB0aGlzLm5vZGUuc3R5bGUoJ3RvcCcsIHkgKyAncHgnKVxuICAgICAgLnN0eWxlKCdsZWZ0JywgeCArICdweCcpXG4gICAgICAuc3R5bGUoJ29wYWNpdHknLCAnMScpXG4gICAgICAudGV4dCh0ZXh0KVxuICB9XG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnQgZGVmYXVsdCB7cmVhZFN0YWNrLCBwcm9jZXNzRGF0YSwgZ2V0U3RhcnRzLCBnZXREYXRhTGluZXN9XG5cbmZ1bmN0aW9uIGdldFBvc01hcChzdHJlYW1zKSB7XG4gIGxldCBwb3NNYXAgPSB7fVxuICBzdHJlYW1zLmZvckVhY2goc3RyZWFtID0+IHtcbiAgICBsZXQgZnJvbSA9IG51bGxcbiAgICBzdHJlYW0udmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgaWYgKHZhbHVlLnR5cGUgIT09ICdyZWN2Jykge1xuICAgICAgICBwb3NNYXBbdmFsdWUudWlkXSA9IHtcbiAgICAgICAgICBzaWQ6IHZhbHVlLnNpZCxcbiAgICAgICAgICB4cG9zOiB2YWx1ZS54cG9zLFxuICAgICAgICAgIGFzeW5jOiB2YWx1ZS5hc3luYyxcbiAgICAgICAgICBhZ3JvdXA6IHZhbHVlLmFncm91cCxcbiAgICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICAgIHRvQXN5bmM6IHBvc01hcFt2YWx1ZS51aWRdID8gcG9zTWFwW3ZhbHVlLnVpZF0udG9Bc3luYyA6IGZhbHNlLFxuICAgICAgICAgIHRvOiBwb3NNYXBbdmFsdWUudWlkXSA/IHBvc01hcFt2YWx1ZS51aWRdLnRvIDogW10sXG4gICAgICAgICAgc291cmNlZDogdHJ1ZSxcbiAgICAgICAgICBlbmRzOiBwb3NNYXBbdmFsdWUudWlkXSA/IHBvc01hcFt2YWx1ZS51aWRdLmVuZHMgOiBbXVxuICAgICAgICB9XG4gICAgICAgIGlmIChwb3NNYXBbZnJvbV0pIHtcbiAgICAgICAgICBwb3NNYXBbZnJvbV0udG8ucHVzaCh2YWx1ZS51aWQpXG4gICAgICAgICAgaWYgKHZhbHVlLmFzeW5jIHx8IHZhbHVlLmFncm91cCAhPT0gcG9zTWFwW2Zyb21dLmFncm91cCB8fCB2YWx1ZS54cG9zICE9PSBwb3NNYXBbZnJvbV0ueHBvcykge1xuICAgICAgICAgICAgcG9zTWFwW2Zyb21dLnRvQXN5bmMgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlLnR5cGUgPT09ICdyZWN2Jykge1xuICAgICAgICBpZiAoIXBvc01hcFt2YWx1ZS51aWRdKSB7XG4gICAgICAgICAgcG9zTWFwW3ZhbHVlLnVpZF0gPSB7ZW5kczogW10sIHRvOiBbXSwgc291cmNlZDogZmFsc2V9XG4gICAgICAgIH1cbiAgICAgICAgZnJvbSA9IHZhbHVlLnVpZFxuICAgICAgICBwb3NNYXBbdmFsdWUudWlkXS5lbmRzLnB1c2goe1xuICAgICAgICAgIHNpZDogdmFsdWUuc2lkLFxuICAgICAgICAgIHhwb3M6IHZhbHVlLnhwb3MsXG4gICAgICAgICAgYWdyb3VwOiB2YWx1ZS5hZ3JvdXAsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfSlcbiAgcmV0dXJuIHBvc01hcFxufVxuXG5mdW5jdGlvbiBzZXR0bGVQb3MocG9zTWFwLCBzaWRzKSB7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2VcbiAgT2JqZWN0LmtleXMocG9zTWFwKS5mb3JFYWNoKHVpZCA9PiB7XG4gICAgbGV0IHBtID0gcG9zTWFwW3VpZF1cbiAgICBwbS5lbmRzLmZvckVhY2goZW5kID0+IHtcbiAgICAgIGlmIChzaWRzLmluZGV4T2YoZW5kLnNpZCkgPCBzaWRzLmluZGV4T2YocG0uc2lkKSkge1xuICAgICAgICBzaWRzLnNwbGljZShzaWRzLmluZGV4T2YoZW5kLnNpZCksIDEpXG4gICAgICAgIHNpZHMuc3BsaWNlKHNpZHMuaW5kZXhPZihwbS5zaWQpICsgMSwgMCwgZW5kLnNpZClcbiAgICAgICAgY2hhbmdlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9KVxuICB9KVxuICByZXR1cm4gY2hhbmdlZFxufVxuXG5mdW5jdGlvbiBnZXRTdGFydHMoZ3JvdXBzLCB0aW1lU2NhbGUsIGNyYWQsIGNtYXIpIHtcbiAgbGV0IHN0YXJ0cyA9IFtdXG4gICAgLCBsYXN0ID0gMFxuICAgICwgbHN0YXJ0ID0gZ3JvdXBzWzBdLnN0YXJ0XG4gIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICBsYXN0ICs9IChncm91cC5zdGFydCAtIGxzdGFydCkgKiB0aW1lU2NhbGVcbiAgICBzdGFydHMucHVzaChsYXN0KVxuICAgIGxzdGFydCA9IGdyb3VwLnN0YXJ0XG4gICAgbGFzdCArPSBncm91cC53aWR0aCAqIChjcmFkICogMiArIGNtYXIpIC0gY21hclxuICB9KVxuXG4gIHJldHVybiBzdGFydHNcbn1cblxuZnVuY3Rpb24gZ2V0RGF0YUxpbmVzKHBvc01hcCwgeCwgeXNpZCkge1xuICBsZXQgZGF0YUxpbmVzID0gW11cbiAgT2JqZWN0LmtleXMocG9zTWFwKS5mb3JFYWNoKHVpZCA9PiB7XG4gICAgbGV0IHtlbmRzLCBhZ3JvdXAsIHhwb3MsIHNpZH0gPSBwb3NNYXBbdWlkXVxuICAgIGVuZHMuZm9yRWFjaChkZXN0ID0+IHtcbiAgICAgIGRhdGFMaW5lcy5wdXNoKHtcbiAgICAgICAgaWQ6IHVpZCxcbiAgICAgICAgdWlkLFxuICAgICAgICBmcm9tOiB7XG4gICAgICAgICAgeTogeXNpZChzaWQpLFxuICAgICAgICAgIHg6IHgoYWdyb3VwLCB4cG9zKSxcbiAgICAgICAgfSxcbiAgICAgICAgdG86IHtcbiAgICAgICAgICB5OiB5c2lkKGRlc3Quc2lkKSxcbiAgICAgICAgICB4OiB4KGRlc3QuYWdyb3VwLCBkZXN0Lnhwb3MpLFxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG4gIHJldHVybiBkYXRhTGluZXNcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0RhdGEoZGF0YSkge1xuICBsZXQgc3RyZWFtcyA9IE9iamVjdC5rZXlzKGRhdGEuc3RyZWFtcykubWFwKGlkID0+IGRhdGEuc3RyZWFtc1tpZF0pXG4gIGxldCBzaWRzID0gc3RyZWFtcy5tYXAocyA9PiBzLmlkKVxuXG4gIGxldCBwb3NNYXAgPSBnZXRQb3NNYXAoc3RyZWFtcylcblxuICBmb3IgKGxldCBpPTA7IGk8MTAwOyBpKyspIHtcbiAgICBpZiAoIXNldHRsZVBvcyhwb3NNYXAsIHNpZHMpKSBicmVha1xuICB9XG5cbiAgcmV0dXJuIHtzdHJlYW1zLCBwb3NNYXAsIHNpZHN9XG59XG5cbmZ1bmN0aW9uIHJlYWRTdGFjayhzdGFjaykge1xuICBsZXQgcGFydHMgPSBzdGFjay50cmltKCkuc3BsaXQoLyAvZylcbiAgcGFydHMuc2hpZnQoKSAvLyAnYXQnXG4gIGxldCBuYW1lID0gJyhtYWluKSdcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgeyAvLyBpbiBhIGZ1bmN0aW9uXG4gICAgbmFtZSA9IHBhcnRzLnNoaWZ0KClcbiAgICBwYXJ0c1swXSA9IHBhcnRzWzBdLnNsaWNlKDEsIC0xKVxuICB9XG4gIGlmIChwYXJ0c1swXSA9PT0gJ2V2YWwnKSB7XG4gICAgbmFtZSA9ICdldmFsJ1xuICAgIHBhcnRzID0gcGFydHMuc2xpY2UoLTEpXG4gICAgcGFydHNbMF0gPSBwYXJ0c1swXS5zbGljZSgwLCAtMSlcbiAgfVxuICBsZXQgZmluZm8gPSBwYXJ0c1swXS5zcGxpdCgnLycpLnNsaWNlKC0xKVswXS5zcGxpdCgnOicpXG4gIHJldHVybiBuYW1lICsgJyAnICsgZmluZm9bMF0gKyBgICgke2ZpbmZvLnNsaWNlKDEpLmpvaW4oJzonKX0pYFxufVxuXG5cblxuIl19

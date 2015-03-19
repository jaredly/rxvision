/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nvar _interopRequire = __webpack_require__(5)[\"default\"];\n\nvar wrap = _interopRequire(__webpack_require__(1));\n\nvar Tracer = _interopRequire(__webpack_require__(2));\n\nfunction main() {\n  if (!window.Rx) {\n    console.warn(\"global Rx not found!\");\n    return;\n  }\n\n  var tracer = new Tracer({\n    filterFiles: [\"rx.all.js\", \"rxvision.js\"],\n    onValue: function onValue(entry, id) {}\n  });\n  wrap(window.Rx, tracer);\n  window.__rxvision_tracer = tracer;\n\n  window.txDump = function () {\n    var t = document.createElement(\"textarea\");\n    t.value = JSON.stringify(tracer.dump());\n    document.body.appendChild(t);\n  };\n}\n\nmain();\n\n// console.log('rxvision', entry.type, entry.value, id, entry)\n\n/*****************\n ** WEBPACK FOOTER\n ** ./run/rx.js\n ** module id = 0\n ** module chunks = 2\n **/\n//# sourceURL=webpack:///./run/rx.js?");

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nvar _interopRequire = __webpack_require__(5)[\"default\"];\n\nmodule.exports = wrap;\n\nvar utils = _interopRequire(__webpack_require__(11));\n\nfunction wrap(Rx, tracer) {\n  var oProto = Rx.Observable.prototype;\n  var oMap = oProto.map;\n\n  // decorate fromEvent\n  utils.decorate(Rx.Observable, \"fromEvent\", function (fn) {\n    return function (el, evt) {\n      var stack = tracer.getStack();\n      if (!stack) return fn.apply(this, arguments);\n      var sid = tracer.addStream({\n        type: \"fromEvent\",\n        title: \"\\\"\" + evt + \"\\\" event\",\n        source: null,\n        stack: stack,\n        meta: {\n          el: arguments[0] } });\n      var obs = oMap.call(fn.apply(this, arguments), tracer.traceMap(sid, \"send\"));\n      obs.__rxvision_id = sid;\n      return obs;\n    };\n  });\n\n  // decorate fromArray\n  utils.decorate(Rx.Observable, \"fromArray\", function (fn) {\n    return function (arr) {\n      var stack = tracer.getStack();\n      if (!stack) return fn.apply(this, arguments);\n      var sid = tracer.addStream({\n        type: \"fromArray\",\n        title: \"from array (ln \" + arr.length + \")\",\n        source: null,\n        stack: stack,\n        meta: {\n          array: arr } });\n      var obs = oMap.call(fn.apply(this, arguments), tracer.traceMap(sid, \"send\"));\n      obs.__rxvision_id = sid;\n      return obs;\n    };\n  });\n\n  // decorate fromEvent\n  utils.decorate(Rx.Observable, \"create\", function (fn) {\n    return function () {\n      var stack = tracer.getStack();\n      if (!stack) return fn.apply(this, arguments);\n      var sid = tracer.addStream({\n        type: \"create\",\n        title: \"create\",\n        source: null,\n        stack: stack });\n      var obs = oMap.call(fn.apply(this, arguments), tracer.traceMap(sid, \"send\"));\n      obs.__rxvision_id = sid;\n      return obs;\n    };\n  });\n\n  utils.decorate(oProto, \"share\", function (fn) {\n    return function () {\n      var obs = fn.apply(this, arguments);\n      if (this.__rxvision_id) {\n        obs.__rxvision_id = this.__rxvision_id;\n        tracer.streams[this.__rxvision_id].hot = true;\n      }\n      return obs;\n    };\n  });\n\n  //TODO(jared): should we just wrap everything?\n  var wrapping = [\"map\", \"flatMap\", \"select\", \"startWith\", \"combineLatest\", \"merge\"];\n  wrapping.forEach(function (name) {\n    return utils.decorate(oProto, name, function (fn) {\n      return function () {\n        var previd = this.__rxvision_id;\n        if (!previd) return fn.apply(this, arguments);\n        var stack = tracer.getStack(); // are we in user code or rx code?\n        if (!stack) return fn.apply(this, arguments);\n\n        var sid = tracer.addStream({\n          type: name,\n          title: name,\n          source: previd,\n          stack: stack });\n\n        var args = [].slice.call(arguments);\n\n        // item specific things\n        if (name === \"merge\") {\n          if (\"number\" !== typeof args[0]) {\n            var other = args[0];\n            var isWrapped = !!other.__rxvision_id;\n            other.__rxvision_id = other.__rxvision_id || tracer.addStream({\n              type: \"merge\",\n              title: \"from merge with \" + previd,\n              source: null,\n              stack: null,\n              meta: {\n                mergedWith: previd,\n                result: sid } });\n\n            args[0] = oMap.call(other, tracer.traceMap(sid, isWrapped ? \"recv\" : \"pass\"));\n          }\n        } else if (name === \"combineLatest\") {\n          for (var i = 0; i < args.length - 1; i++) {\n            if (Array.isArray(args[i])) continue; // TODO(jared): deal\n            var old = args[i];\n            var isWrapped = !!old.__rxvision_id;\n            old.__rxvision_id = old.__rxvision_id || tracer.addStream({\n              type: \"combineLatest\",\n              title: \"from combineLatest with \" + previd,\n              source: null,\n              stack: null,\n              meta: {\n                combinedWith: previd,\n                result: sid } });\n            args[i] = oMap.call(old, tracer.traceMap(sid, isWrapped ? \"recv\" : \"pass\"));\n          }\n        } else if (name === \"flatMap\") {\n          (function () {\n            var mapper = args[0];\n            args[0] = function () {\n              var full = arguments[0];\n              arguments[0] = arguments[0].value;\n              var childObs = mapper.apply(this, arguments);\n              if (childObs.__rxvision_id) {\n                tracer.trace(childObs.__rxvision_id, \"recv\", full);\n              }\n              return oMap.call(childObs, tracer.traceMap(sid, \"recv\"));\n            }\n            // args[0] = oMap.call(args[0], tracer.traceMap(sid, 'recv'))\n            ;\n          })();\n        }\n\n        var obs = oMap.call(fn.apply(name === \"flatMap\" ? this : oMap.call(this, tracer.traceMap(sid, \"recv\")), args), tracer.traceMap(sid, \"send\"));\n        obs.__rxvision_id = sid;\n        return obs;\n      };\n    });\n  });\n\n  utils.decorate(oProto, \"subscribe\", function (fn) {\n    return function (onValue, onErr, onComp) {\n      if (!onValue || typeof onValue !== \"function\") return fn.apply(this, arguments);\n      var previd = this.__rxvision_id;\n      if (!previd) return fn.apply(this, arguments);\n      var stack = tracer.getStack();\n      if (!stack) return fn.apply(this, arguments);\n      var sid = tracer.addStream({\n        type: \"subscribe\",\n        title: \"subscription\",\n        stack: stack,\n        source: previd });\n\n      // TODO(jared): log errors, completions\n      return fn.apply(oMap.call(this, tracer.traceMap(sid, \"recv\")), arguments);\n    };\n  });\n}\n\n// is there meta info of interest here?\n\n/*****************\n ** WEBPACK FOOTER\n ** ./wrap/rx.js\n ** module id = 1\n ** module chunks = 2\n **/\n//# sourceURL=webpack:///./wrap/rx.js?");

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nmodule.exports = __webpack_require__(7);\n\n/*****************\n ** WEBPACK FOOTER\n ** ./index.js\n ** module id = 2\n ** module chunks = 0 2\n **/\n//# sourceURL=webpack:///./index.js?");

/***/ },
/* 3 */,
/* 4 */,
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nexports[\"default\"] = function (obj) {\n  return obj && obj.__esModule ? obj[\"default\"] : obj;\n};\n\nexports.__esModule = true;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./~/babel-runtime/helpers/interop-require.js\n ** module id = 5\n ** module chunks = 0 1 2\n **/\n//# sourceURL=webpack:///./~/babel-runtime/helpers/interop-require.js?");

/***/ },
/* 6 */,
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nvar _classCallCheck = __webpack_require__(8)[\"default\"];\n\nvar _createClass = __webpack_require__(9)[\"default\"];\n\nvar _interopRequire = __webpack_require__(5)[\"default\"];\n\nvar assign = _interopRequire(__webpack_require__(14));\n\nvar utils = _interopRequire(__webpack_require__(11));\n\nvar Tracer = (function () {\n  function Tracer(config) {\n    _classCallCheck(this, Tracer);\n\n    this.config = assign({\n      filterFiles: [],\n      onValue: function onValue() {},\n      onStream: function onStream() {} }, config);\n    this.reset();\n  }\n\n  _createClass(Tracer, {\n    reset: {\n      value: function reset() {\n        this.streams = {};\n        // this.sids = {}\n        // this.positions = []\n\n        this.agroups = [];\n        this._ag = -1;\n        this._xpos = 0;\n        this._last = null;\n\n        this._sid = 10;\n        this._uid = 1000;\n      }\n    },\n    getStack: {\n      value: function getStack() {\n        var filterFiles = this.config.filterFiles;\n        try {\n          throw new Error();\n        } catch (e) {\n          // first two lines are right here, and the caller (from rx-tracer.js)\n          return e.stack.split(\"\\n\").slice(3, 4).filter(function (line) {\n            return !filterFiles.some(function (file) {\n              return line.indexOf(file) !== -1;\n            });\n          }).join(\"\\n\") // && e.stack\n          ;\n        }\n      }\n    },\n    populateXpos: {\n      value: function populateXpos(entry) {\n        if (entry.async || this._ag === -1) {\n          // new agroup\n          this.agroups.push({\n            size: 0,\n            width: 1,\n            start: entry.ts,\n            initiator: entry });\n          this._ag = this.agroups.length - 1;\n          this._xpos = 0;\n          this._last = null;\n        }\n\n        entry.xpos = this._xpos;\n        entry.agroup = this._ag;\n        this.agroups[this._ag].size += 1;\n\n        if (!this._last) {\n          return this._last = entry;\n        }var _last = this._last;\n        var lsid = _last.sid;\n        var ltype = _last.type;\n\n        if (\n        // same line, handoff\n        entry.sid === lsid && ltype === \"recv\" && entry.type === \"send\" || entry.sid > lsid && /*entry.sid > lsid && */ltype !== entry.type) {} else {\n          entry.xpos += 1;\n          this._xpos += 1;\n          this.agroups[this._ag].width = this._xpos + 1;\n        }\n\n        this._last = entry;\n      }\n    },\n    getSid: {\n      value: function getSid() {\n        return this._sid++;\n      }\n    },\n    getUid: {\n      value: function getUid() {\n        return this._uid++;\n      }\n    },\n    addStream: {\n      value: function addStream(stream, atPos) {\n        var sid = this.getSid();\n        stream.id = sid;\n        stream.values = [];\n        stream.insync = setTimeout(function () {\n          return stream.insync = null;\n        }, 0);\n        // debug stream creation console.log('created stream', stream)\n        this.streams[sid] = stream;\n        // this.config.onStream(stream)\n        if (atPos) {}\n        return sid;\n      }\n    },\n    trace: {\n      value: function trace(sid, type, em, value) {\n        var wrapped = type === \"recv\" || type === \"pass-wrapped\";\n        var stream = this.streams[sid];\n\n        if (wrapped && (!value || !value.uid)) {\n          console.warn(\"bad value received...\", sid, stream, value);\n          return value;\n        }\n        var uid = wrapped ? value.uid : this.getUid();\n        var entry = {\n          value: wrapped ? value.value : value,\n          async: type === \"send\" && stream.insync === null,\n          ts: Date.now(),\n          // active: em ? em._active : true,\n          // alive: em ? em._alive : true,\n          sid: sid,\n          type: type,\n          uid: uid };\n\n        this.populateXpos(entry);\n\n        stream.values.push(entry);\n        this.config.onValue(entry, sid);\n        if (type === \"send\") {\n          // data is leaving this stream\n          // debug wrap / unwrap console.log('wrapping', value, uid, sid, stream)\n          value = { value: value, uid: uid };\n        } else if (type === \"recv\") {\n          // data is entering this stream\n          value = value.value;\n          // debug wrap / unwrap console.log('unwrapping', value, uid, sid, stream)\n          if (stream.insync === null) {\n            stream.insync = setTimeout(function () {\n              return stream.insync = null;\n            }, 0);\n          }\n        }\n        return value;\n      }\n    },\n    traceMap: {\n      value: function traceMap(sid, type, em) {\n        if ([\"send\", \"recv\", \"pass\", \"pass-wrapped\"].indexOf(type) === -1) {\n          throw new Error(\"invalid map type: \" + type);\n        }\n        var trace = this.trace.bind(this, sid, type, em);\n        return trace;\n      }\n    },\n    dump: {\n      value: function dump() {\n        var streams = {};\n        var cleanValue = function (value) {\n          var clean = assign({}, value);\n          clean.value = utils.asString(value.value).slice(0, 100);\n          return clean;\n        };\n        for (var sid in this.streams) {\n          var stream = this.streams[sid];\n          streams[sid] = assign({}, stream);\n          streams[sid].values = stream.values.map(cleanValue);\n          streams[sid].meta = utils.asString(streams[sid].meta).slice(0, 100);\n        }\n        var groups = this.agroups.map(function (group) {\n          group = assign({}, group);\n          group.initiator = assign({}, group.initiator, {\n            value: utils.asString(group.initiator.value).slice(0, 100)\n          });\n          return group;\n        });\n        return { streams: streams, groups: groups };\n      }\n    }\n  });\n\n  return Tracer;\n})();\n\nmodule.exports = Tracer;\n\n// later line, no interference\n\n// pass\n\n// this.positions\n\n/*****************\n ** WEBPACK FOOTER\n ** ./lib/tracer.js\n ** module id = 7\n ** module chunks = 0 2\n **/\n//# sourceURL=webpack:///./lib/tracer.js?");

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nexports[\"default\"] = function (instance, Constructor) {\n  if (!(instance instanceof Constructor)) {\n    throw new TypeError(\"Cannot call a class as a function\");\n  }\n};\n\nexports.__esModule = true;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./~/babel-runtime/helpers/class-call-check.js\n ** module id = 8\n ** module chunks = 0 1 2\n **/\n//# sourceURL=webpack:///./~/babel-runtime/helpers/class-call-check.js?");

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nexports[\"default\"] = (function () {\n  function defineProperties(target, props) {\n    for (var key in props) {\n      var prop = props[key];\n      prop.configurable = true;\n      if (prop.value) prop.writable = true;\n    }\n\n    Object.defineProperties(target, props);\n  }\n\n  return function (Constructor, protoProps, staticProps) {\n    if (protoProps) defineProperties(Constructor.prototype, protoProps);\n    if (staticProps) defineProperties(Constructor, staticProps);\n    return Constructor;\n  };\n})();\n\nexports.__esModule = true;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./~/babel-runtime/helpers/create-class.js\n ** module id = 9\n ** module chunks = 0 1 2\n **/\n//# sourceURL=webpack:///./~/babel-runtime/helpers/create-class.js?");

/***/ },
/* 10 */,
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nmodule.exports = {\n  decorate: function decorate(obj, attr, decorator) {\n    obj[attr] = decorator(obj[attr]);\n  },\n  asString: function asString(value) {\n    try {\n      return JSON.stringify(value) + \"\";\n    } catch (e) {}\n    try {\n      return value + \"\";\n    } catch (e) {}\n    return \"value cannot be previewed\";\n  }\n};\n\n/*****************\n ** WEBPACK FOOTER\n ** ./lib/utils.js\n ** module id = 11\n ** module chunks = 0 1 2\n **/\n//# sourceURL=webpack:///./lib/utils.js?");

/***/ },
/* 12 */,
/* 13 */,
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	eval("'use strict';\n\nfunction ToObject(val) {\n\tif (val == null) {\n\t\tthrow new TypeError('Object.assign cannot be called with null or undefined');\n\t}\n\n\treturn Object(val);\n}\n\nmodule.exports = Object.assign || function (target, source) {\n\tvar from;\n\tvar keys;\n\tvar to = ToObject(target);\n\n\tfor (var s = 1; s < arguments.length; s++) {\n\t\tfrom = arguments[s];\n\t\tkeys = Object.keys(Object(from));\n\n\t\tfor (var i = 0; i < keys.length; i++) {\n\t\t\tto[keys[i]] = from[keys[i]];\n\t\t}\n\t}\n\n\treturn to;\n};\n\n\n/*****************\n ** WEBPACK FOOTER\n ** ./~/object-assign/index.js\n ** module id = 14\n ** module chunks = 0 2\n **/\n//# sourceURL=webpack:///./~/object-assign/index.js?");

/***/ }
/******/ ]);
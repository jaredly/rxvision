(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/jared/clone/rxvision/index.js":[function(require,module,exports){
"use strict";

module.exports = require("./lib/tracer");

},{"./lib/tracer":"/home/jared/clone/rxvision/lib/tracer.js"}],"/home/jared/clone/rxvision/lib/tracer.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var assign = _interopRequire(require("object-assign"));

var utils = _interopRequire(require("./utils"));

var Tracer = (function () {
  function Tracer(config) {
    _classCallCheck(this, Tracer);

    this.config = assign({
      filterFiles: [],
      onValue: function onValue() {},
      onStream: function onStream() {} }, config);
    this.reset();
  }

  _prototypeProperties(Tracer, null, {
    reset: {
      value: function reset() {
        this.streams = {};
        // this.sids = {}
        // this.positions = []

        this.agroups = [];
        this._ag = -1;
        this._xpos = 0;
        this._last = null;

        this._sid = 10;
        this._uid = 1000;
      },
      writable: true,
      configurable: true
    },
    getStack: {
      value: function getStack() {
        var filterFiles = this.config.filterFiles;
        try {
          throw new Error();
        } catch (e) {
          // first two lines are right here, and the caller (from rx-tracer.js)
          return e.stack.split("\n").slice(3, 4).filter(function (line) {
            return !filterFiles.some(function (file) {
              return line.indexOf(file) !== -1;
            });
          }).join("\n") // && e.stack
          ;
        }
      },
      writable: true,
      configurable: true
    },
    populateXpos: {
      value: function populateXpos(entry) {
        if (entry.async || this._ag === -1) {
          // new agroup
          this.agroups.push({
            size: 0,
            width: 1,
            start: entry.ts,
            initiator: entry });
          this._ag = this.agroups.length - 1;
          this._xpos = 0;
          this._last = null;
        }

        entry.xpos = this._xpos;
        entry.agroup = this._ag;
        this.agroups[this._ag].size += 1;

        if (!this._last) {
          return this._last = entry;
        }var _last = this._last;
        var lsid = _last.sid;
        var ltype = _last.type;

        if (
        // same line, handoff
        entry.sid === lsid && ltype === "recv" && entry.type === "send" || entry.sid > lsid && ltype !== entry.type) {} else {
          entry.xpos += 1;
          this._xpos += 1;
          this.agroups[this._ag].width = this._xpos + 1;
        }

        this._last = entry;
      },
      writable: true,
      configurable: true
    },
    getSid: {
      value: function getSid() {
        return this._sid++;
      },
      writable: true,
      configurable: true
    },
    getUid: {
      value: function getUid() {
        return this._uid++;
      },
      writable: true,
      configurable: true
    },
    addStream: {
      value: function addStream(stream, atPos) {
        var sid = this.getSid();
        stream.id = sid;
        stream.values = [];
        stream.insync = setTimeout(function () {
          return stream.insync = null;
        }, 0);
        // debug stream creation console.log('created stream', stream)
        this.streams[sid] = stream;
        // this.config.onStream(stream)
        if (atPos) {}
        return sid;
      },
      writable: true,
      configurable: true
    },
    trace: {
      value: function trace(sid, type, value) {
        var wrapped = type === "recv" || type === "pass-wrapped";
        var stream = this.streams[sid];

        if (wrapped && (!value || !value.uid)) {
          console.warn("bad value received...", sid, stream, value);
          return value;
        }
        var uid = wrapped ? value.uid : this.getUid();
        var entry = {
          value: wrapped ? value.value : value,
          async: type === "send" && stream.insync === null,
          ts: Date.now(),
          sid: sid,
          type: type,
          uid: uid };

        this.populateXpos(entry);

        stream.values.push(entry);
        this.config.onValue(entry, sid);
        if (type === "send") {
          // data is leaving this stream
          // debug wrap / unwrap console.log('wrapping', value, uid, sid, stream)
          value = { value: value, uid: uid };
        } else if (type === "recv") {
          // data is entering this stream
          value = value.value;
          // debug wrap / unwrap console.log('unwrapping', value, uid, sid, stream)
          if (stream.insync === null) {
            stream.insync = setTimeout(function () {
              return stream.insync = null;
            }, 0);
          }
        }
        return value;
      },
      writable: true,
      configurable: true
    },
    traceMap: {
      value: function traceMap(sid, type) {
        if (["send", "recv", "pass", "pass-wrapped"].indexOf(type) === -1) {
          throw new Error("invalid map type: " + type);
        }
        var trace = this.trace.bind(this, sid, type);
        return trace;
      },
      writable: true,
      configurable: true
    },
    dump: {
      value: function dump() {
        var streams = {};
        var cleanValue = function (value) {
          var clean = assign({}, value);
          clean.value = utils.asString(value.value).slice(0, 100);
          return clean;
        };
        for (var sid in this.streams) {
          var stream = this.streams[sid];
          streams[sid] = assign({}, stream);
          streams[sid].values = stream.values.map(cleanValue);
          streams[sid].meta = utils.asString(streams[sid].meta).slice(0, 100);
        }
        var groups = this.agroups.map(function (group) {
          group = assign({}, group);
          group.initiator = assign({}, group.initiator, {
            value: utils.asString(group.initiator.value).slice(0, 100)
          });
          return group;
        });
        return { streams: streams, groups: groups };
      },
      writable: true,
      configurable: true
    }
  });

  return Tracer;
})();

module.exports = Tracer;

// later line, no interference

// pass

// this.positions

},{"./utils":"/home/jared/clone/rxvision/lib/utils.js","object-assign":"/home/jared/clone/rxvision/node_modules/object-assign/index.js"}],"/home/jared/clone/rxvision/lib/utils.js":[function(require,module,exports){
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

},{}],"/home/jared/clone/rxvision/node_modules/object-assign/index.js":[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],"/home/jared/clone/rxvision/run/kefir.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var wrap = _interopRequire(require("../wrap/kefir"));

var Tracer = _interopRequire(require(".."));

function main() {
  if (!window.Kefir) {
    console.warn("global Kefir not found!");
    return;
  }

  var tracer = new Tracer({
    filterFiles: ["kefir.js", "kefirvision.js"],
    onValue: function onValue(entry, id) {}
  });
  wrap(window.Kefir, tracer);
  window.__rxvision_tracer = tracer;

  window.txDump = function () {
    var t = document.createElement("textarea");
    t.value = JSON.stringify(tracer.dump());
    document.body.appendChild(t);
  };
}

main();

// console.log('rxvision', entry.type, entry.value, id, entry)

},{"..":"/home/jared/clone/rxvision/index.js","../wrap/kefir":"/home/jared/clone/rxvision/wrap/kefir.js"}],"/home/jared/clone/rxvision/wrap/kefir.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

module.exports = wrap;

var utils = _interopRequire(require("../lib/utils"));

function wrap(Kefir, tracer) {
  var sProto = Kefir.Stream.prototype;
  var pProto = Kefir.Property.prototype;
  var oProto = Kefir.Observable.prototype;
  var sMap = sProto.map;
  var pMap = pProto.map;

  function decorate(name, dec) {
    utils.decorate(sProto, name, dec(sMap));
    utils.decorate(pProto, name, dec(pMap));
  }

  var wrapping = ["map", "mapTo", "selectBy", "combine", "merge", "flatMap"];

  wrapping.forEach(function (name) {
    return decorate(name, function (map) {
      return function (fn) {
        return function () {
          var previd = this.__rxvision_id;
          if (!previd) return fn.apply(this, arguments);
          var stack = tracer.getStack(); // are we in user code or rx code?
          if (!stack) return fn.apply(this, arguments);

          var sid = tracer.addStream({
            type: name,
            title: name,
            source: previd,
            stack: stack });

          var args = [].slice.call(arguments);

          var obs = map.call(fn.apply(map.call(this, tracer.traceMap(sid, "recv")), args), tracer.traceMap(sid, "send"));
          obs.__rxvision_id = sid;
          return obs;
        };
      };
    });
  });

  // initializers
  var initializers = {
    fromEvent: function fromEvent(el, evt) {
      return {
        title: "\"" + evt + "\" event",
        meta: {
          el: el }
      };
    },
    // emitter: false,
    // bus: false,
    sequentially: false,
    later: false };
  Object.keys(initializers).forEach(function (name) {
    return utils.decorate(Kefir, name, function (fn) {
      return function () {
        var stack = tracer.getStack();
        if (!stack) return fn.apply(this, arguments);
        var options = {
          type: name,
          title: name,
          source: null,
          stack: stack,
          meta: {} };
        if (initializers[name]) {
          var extra = initializers[name].apply(null, arguments);
          for (var attr in extra) {
            options[attr] = extra[attr];
          }
        }
        var sid = tracer.addStream(options);
        var obs = sMap.call(fn.apply(this, arguments), tracer.traceMap(sid, "send"));
        obs.__rxvision_id = sid;
        return obs;
      };
    });
  });

  utils.decorate(Kefir, "emitter", function (fn) {
    return function (el, evt) {
      var stack = tracer.getStack();
      if (!stack) return fn.apply(this, arguments);
      var options = {
        type: "emitter",
        title: "emitter",
        source: null,
        stack: stack,
        meta: {} };
      var sid = tracer.addStream(options);
      var em = fn.apply(this, arguments);
      em.__rxvision_id = sid;
      return em;
    };
  });

  var emitterLike = ["emitter", "pool", "bus"];

  emitterLike.map(function (name) {
    return utils.decorate(Kefir, name, function (fn) {
      return function (el, evt) {
        var stack = tracer.getStack();
        if (!stack) return fn.apply(this, arguments);
        var options = {
          type: name,
          title: name,
          source: null,
          stack: stack,
          meta: {} };
        var sid = tracer.addStream(options);
        var em = fn.apply(this, arguments);
        em.__rxvision_id = sid;
        if (name === "bus" || name === "pool") {
          this._rxv_plugmap = new Map();
        }
        return em;
      };
    });
  });

  utils.decorate(Kefir.Emitter.prototype, "emit", function (fn) {
    return function (value) {
      if (!this.__rxvision_id) return fn.apply(this, arguments);
      value = tracer.trace(this.__rxvision_id, "send", value);
      fn.call(this, value);
    };
  });

  utils.decorate(Kefir.Bus.prototype, "emit", function (fn) {
    return function (value) {
      if (!this.__rxvision_id) return fn.apply(this, arguments);
      value = tracer.trace(this.__rxvision_id, "send", value);
      fn.call(this, value);
    };
  });

  var pools = [Kefir.Bus.prototype, Kefir.Pool.prototype];

  pools.forEach(function (proto) {
    utils.decorate(proto, "plug", function (fn) {
      return function (value) {
        if (!this.__rxvision_id) return fn.apply(this, arguments);
        var other = sMap.apply(value, tracer.traceMap(this.__rxvision_id, "pass-wrapped"));
        if (!this._rxv_plugmap) {
          this._rxv_plugmap = new Map();
        }
        this._rxv_plugmap.set(value, other);
        return fn.call(this, other);
      };
    });

    utils.decorate(proto, "unplug", function (fn) {
      return function (value) {
        if (!this.__rxvision_id) return fn.apply(this, arguments);
        var other = this._rxv_plugmap.get(value);
        this._rxv_plugmap["delete"](value);
        return fn.call(this, other);
      };
    });
  });

  /*
  utils.decorate(Kefir, 'fromEvent', fn => function (el, evt) {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'fromEvent',
      title: `"${evt}" event`,
      source: null,
      stack: stack,
      meta: {
        el: arguments[0],
      },
    })
    let obs = sMap.call(
      fn.apply(this, arguments),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  })
   utils.decorate(Kefir, 'emitter', fn => function () {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'emitter',
      title: 'custom emitter',
      source: null,
      stack: stack,
      meta: {
      },
    })
    let obs = sMap.call(
      fn.apply(this, arguments),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  })
   utils.decorate(Kefir, 'bus', fn => function () {
    let stack = tracer.getStack()
    if (!stack) return fn.apply(this, arguments)
    let sid = tracer.addStream({
      type: 'bus',
      title: 'custom bus',
      source: null,
      stack: stack,
      meta: {
      },
    })
    let obs = sMap.call(
      fn.apply(this, arguments),
      tracer.traceMap(sid, 'send')
    )
    obs.__rxvision_id = sid
    return obs
  })
  */

  var receivers = ["log", "onValue", "onAny", "onError"];

  receivers.forEach(function (name) {
    return decorate(name, function (map) {
      return function (fn) {
        return function () {
          var previd = this.__rxvision_id;
          if (!previd) return fn.apply(this, arguments);
          var stack = tracer.getStack();
          if (!stack) return fn.apply(this, arguments);
          var sid = tracer.addStream({
            type: name,
            title: name,
            stack: stack,
            source: previd });

          // TODO(jared): log errors, completions
          return fn.apply(map.call(this, tracer.traceMap(sid, "recv")), arguments);
        };
      };
    });
  });
}

// is there meta info of interest here?

},{"../lib/utils":"/home/jared/clone/rxvision/lib/utils.js"}]},{},["/home/jared/clone/rxvision/run/kefir.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdjAuMTAuMzMvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vaW5kZXguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi9saWIvdHJhY2VyLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vbGliL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi9ydW4va2VmaXIuanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi93cmFwL2tlZmlyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7SUNDakMsTUFBTSwyQkFBTSxlQUFlOztJQUMzQixLQUFLLDJCQUFNLFNBQVM7O0lBRU4sTUFBTTtBQUNkLFdBRFEsTUFBTSxDQUNiLE1BQU07MEJBREMsTUFBTTs7QUFFdkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDbkIsaUJBQVcsRUFBRSxFQUFFO0FBQ2YsYUFBTyxFQUFFLG1CQUFVLEVBQUU7QUFDckIsY0FBUSxFQUFFLG9CQUFVLEVBQUUsRUFDdkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUNWLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtHQUNiOzt1QkFSa0IsTUFBTTtBQVV6QixTQUFLO2FBQUEsaUJBQUc7QUFDTixZQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTs7OztBQUlqQixZQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtBQUNqQixZQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ2IsWUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUE7QUFDZCxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTs7QUFFakIsWUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUE7QUFDZCxZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtPQUNqQjs7OztBQUVELFlBQVE7YUFBQSxvQkFBRztBQUNULFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFBO0FBQ3pDLFlBQUk7QUFBQyxnQkFBTSxJQUFJLEtBQUssRUFBRSxDQUFBO1NBQUMsQ0FDdkIsT0FBTyxDQUFDLEVBQUU7O0FBRVIsaUJBQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDbkMsTUFBTSxDQUFDLFVBQUEsSUFBSTttQkFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBQSxJQUFJO3FCQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQUEsQ0FBQztXQUFBLENBQUMsQ0FDcEUsSUFBSSxDQUFDLElBQUksQ0FBQztXQUFBO1NBQ2Q7T0FDRjs7OztBQUVELGdCQUFZO2FBQUEsc0JBQUMsS0FBSyxFQUFFO0FBQ2xCLFlBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFOztBQUNsQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNoQixnQkFBSSxFQUFFLENBQUM7QUFDUCxpQkFBSyxFQUFFLENBQUM7QUFDUixpQkFBSyxFQUFFLEtBQUssQ0FBQyxFQUFFO0FBQ2YscUJBQVMsRUFBRSxLQUFLLEVBQ2pCLENBQUMsQ0FBQTtBQUNGLGNBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0FBQ2xDLGNBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO0FBQ2QsY0FBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7U0FDbEI7O0FBRUQsYUFBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO0FBQ3ZCLGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtBQUN2QixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFBOztBQUVoQyxZQUFJLENBQUMsSUFBSSxDQUFDLEtBQUs7QUFBRSxpQkFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtTQUFBLFlBRVgsSUFBSSxDQUFDLEtBQUs7WUFBL0IsSUFBSSxTQUFULEdBQUc7WUFBYyxLQUFLLFNBQVgsSUFBSTs7QUFDcEI7O0FBRUUsQUFBQyxhQUFLLENBQUMsR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUUvRCxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksQUFBQyxFQUMxQyxFQUVELE1BQU07QUFDTCxlQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQTtBQUNmLGNBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFBO0FBQ2YsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO1NBQzlDOztBQUVELFlBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO09BQ25COzs7O0FBRUQsVUFBTTthQUFBLGtCQUFHO0FBQ1AsZUFBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7T0FDbkI7Ozs7QUFFRCxVQUFNO2FBQUEsa0JBQUc7QUFDUCxlQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtPQUNuQjs7OztBQUVELGFBQVM7YUFBQSxtQkFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFO0FBQ3ZCLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtBQUN2QixjQUFNLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQTtBQUNmLGNBQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLGNBQU0sQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO2lCQUFNLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSTtTQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUE7O0FBRXpELFlBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFBOztBQUUxQixZQUFJLEtBQUssRUFBRSxFQUVWO0FBQ0QsZUFBTyxHQUFHLENBQUE7T0FDWDs7OztBQUVELFNBQUs7YUFBQSxlQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ3RCLFlBQUksT0FBTyxHQUFHLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLGNBQWMsQ0FBQTtBQUN4RCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUU5QixZQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUEsQUFBQyxFQUFFO0FBQ3JDLGlCQUFPLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDekQsaUJBQU8sS0FBSyxDQUFBO1NBQ2I7QUFDRCxZQUFJLEdBQUcsR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7QUFDN0MsWUFBSSxLQUFLLEdBQUc7QUFDVixlQUFLLEVBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSztBQUNwQyxlQUFLLEVBQUUsSUFBSSxLQUFLLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLElBQUk7QUFDaEQsWUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDZCxhQUFHLEVBQUgsR0FBRztBQUNILGNBQUksRUFBSixJQUFJO0FBQ0osYUFBRyxFQUFILEdBQUcsRUFDSixDQUFBOztBQUVELFlBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRXhCLGNBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3pCLFlBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUMvQixZQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7OztBQUVuQixlQUFLLEdBQUcsRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLEdBQUcsRUFBSCxHQUFHLEVBQUMsQ0FBQTtTQUNyQixNQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRTs7QUFDMUIsZUFBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUE7O0FBRW5CLGNBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxJQUFJLEVBQUU7QUFDMUIsa0JBQU0sQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO3FCQUFNLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSTthQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUE7V0FDMUQ7U0FDRjtBQUNELGVBQU8sS0FBSyxDQUFBO09BQ2I7Ozs7QUFFRCxZQUFRO2FBQUEsa0JBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtBQUNsQixZQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2pFLGdCQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxDQUFBO1NBQzdDO0FBQ0QsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUM1QyxlQUFPLEtBQUssQ0FBQTtPQUNiOzs7O0FBRUQsUUFBSTthQUFBLGdCQUFHO0FBQ0wsWUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFBO0FBQ2hCLFlBQUksVUFBVSxHQUFHLFVBQUEsS0FBSyxFQUFJO0FBQ3hCLGNBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDN0IsZUFBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ3ZELGlCQUFPLEtBQUssQ0FBQTtTQUNiLENBQUE7QUFDRCxhQUFLLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDNUIsY0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUM5QixpQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDakMsaUJBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDbkQsaUJBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtTQUNwRTtBQUNELFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3JDLGVBQUssR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQ3pCLGVBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQzVDLGlCQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO1dBQzNELENBQUMsQ0FBQTtBQUNGLGlCQUFPLEtBQUssQ0FBQTtTQUNiLENBQUMsQ0FBQTtBQUNGLGVBQU8sRUFBQyxPQUFPLEVBQVAsT0FBTyxFQUFFLE1BQU0sRUFBTixNQUFNLEVBQUMsQ0FBQTtPQUN6Qjs7Ozs7O1NBN0prQixNQUFNOzs7aUJBQU4sTUFBTTs7Ozs7Ozs7Ozs7aUJDSFo7QUFDYixVQUFRLEVBQUEsa0JBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7QUFDN0IsT0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtHQUNqQztBQUNELFVBQVEsRUFBQSxrQkFBQyxLQUFLLEVBQUU7QUFDZCxRQUFJO0FBQUMsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQTtLQUFDLENBQ3ZDLE9BQU0sQ0FBQyxFQUFDLEVBQUU7QUFDVixRQUFJO0FBQUMsYUFBTyxLQUFLLEdBQUMsRUFBRSxDQUFBO0tBQUMsQ0FDckIsT0FBTSxDQUFDLEVBQUMsRUFBRTtBQUNWLFdBQU8sMkJBQTJCLENBQUE7R0FDbkM7Q0FDRjs7O0FDYkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7SUN4Qk8sSUFBSSwyQkFBTSxlQUFlOztJQUN6QixNQUFNLDJCQUFNLElBQUk7O0FBRXZCLFNBQVMsSUFBSSxHQUFHO0FBQ2QsTUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDakIsV0FBTyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0FBQ3ZDLFdBQU07R0FDUDs7QUFFRCxNQUFJLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQztBQUN0QixlQUFXLEVBQUUsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUM7QUFDM0MsV0FBTyxFQUFFLGlCQUFVLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFFN0I7R0FDRixDQUFDLENBQUE7QUFDRixNQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUMxQixRQUFNLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFBOztBQUVqQyxRQUFNLENBQUMsTUFBTSxHQUFHLFlBQVk7QUFDMUIsUUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUMxQyxLQUFDLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7QUFDdkMsWUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FDN0IsQ0FBQTtDQUNGOztBQUdELElBQUksRUFBRSxDQUFBOzs7Ozs7Ozs7aUJDeEJrQixJQUFJOztJQUZyQixLQUFLLDJCQUFNLGNBQWM7O0FBRWpCLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDMUMsTUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7QUFDbkMsTUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUE7QUFDckMsTUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUE7QUFDdkMsTUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtBQUNyQixNQUFJLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBOztBQUVyQixXQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQzNCLFNBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUN2QyxTQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7R0FDeEM7O0FBRUQsTUFBSSxRQUFRLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFBOztBQUUxRSxVQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtXQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBQSxHQUFHO2FBQUksVUFBQSxFQUFFO2VBQUksWUFBWTtBQUMvRCxjQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFBO0FBQy9CLGNBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUM3QyxjQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDN0IsY0FBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBOztBQUU1QyxjQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ3pCLGdCQUFJLEVBQUUsSUFBSTtBQUNWLGlCQUFLLEVBQUUsSUFBSTtBQUNYLGtCQUFNLEVBQUUsTUFBTTtBQUNkLGlCQUFLLEVBQUUsS0FBSyxFQUViLENBQUMsQ0FBQTs7QUFFRixjQUFJLElBQUksR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTs7QUFFbkMsY0FBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FDaEIsRUFBRSxDQUFDLEtBQUssQ0FDTixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUM1QyxJQUFJLENBQUMsRUFDUCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FDN0IsQ0FBQTtBQUNELGFBQUcsQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFBO0FBQ3ZCLGlCQUFPLEdBQUcsQ0FBQTtTQUNYO09BQUE7S0FBQSxDQUFDO0dBQUEsQ0FBQyxDQUFBOzs7QUFHSCxNQUFJLFlBQVksR0FBRztBQUNqQixhQUFTLEVBQUEsbUJBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTtBQUNqQixhQUFPO0FBQ0wsYUFBSyxTQUFNLEdBQUcsYUFBUztBQUN2QixZQUFJLEVBQUU7QUFDSixZQUFFLEVBQUYsRUFBRSxFQUNIO09BQ0YsQ0FBQTtLQUNGOzs7QUFHRCxnQkFBWSxFQUFFLEtBQUs7QUFDbkIsU0FBSyxFQUFFLEtBQUssRUFDYixDQUFBO0FBQ0QsUUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJO1dBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQUEsRUFBRTthQUFJLFlBQVk7QUFDdEYsWUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQzdCLFlBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUM1QyxZQUFJLE9BQU8sR0FBRztBQUNaLGNBQUksRUFBRSxJQUFJO0FBQ1YsZUFBSyxFQUFFLElBQUk7QUFDWCxnQkFBTSxFQUFFLElBQUk7QUFDWixlQUFLLEVBQUUsS0FBSztBQUNaLGNBQUksRUFBRSxFQUFHLEVBQ1YsQ0FBQTtBQUNELFlBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3RCLGNBQUksS0FBSyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ3JELGVBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ3RCLG1CQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1dBQzVCO1NBQ0Y7QUFDRCxZQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ25DLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQ2pCLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUN6QixNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FDN0IsQ0FBQTtBQUNELFdBQUcsQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFBO0FBQ3ZCLGVBQU8sR0FBRyxDQUFBO09BQ1g7S0FBQSxDQUFDO0dBQUEsQ0FBQyxDQUFBOztBQUVILE9BQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFBLEVBQUU7V0FBSSxVQUFVLEVBQUUsRUFBRSxHQUFHLEVBQUU7QUFDeEQsVUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQzdCLFVBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUM1QyxVQUFJLE9BQU8sR0FBRztBQUNaLFlBQUksRUFBRSxTQUFTO0FBQ2YsYUFBSyxFQUFFLFNBQVM7QUFDaEIsY0FBTSxFQUFFLElBQUk7QUFDWixhQUFLLEVBQUUsS0FBSztBQUNaLFlBQUksRUFBRSxFQUFHLEVBQ1YsQ0FBQTtBQUNELFVBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDbkMsVUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDbEMsUUFBRSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUE7QUFDdEIsYUFBTyxFQUFFLENBQUE7S0FDVjtHQUFBLENBQUMsQ0FBQTs7QUFFRixNQUFJLFdBQVcsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7O0FBRTVDLGFBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJO1dBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQUEsRUFBRTthQUFJLFVBQVUsRUFBRSxFQUFFLEdBQUcsRUFBRTtBQUMzRSxZQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDN0IsWUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQzVDLFlBQUksT0FBTyxHQUFHO0FBQ1osY0FBSSxFQUFFLElBQUk7QUFDVixlQUFLLEVBQUUsSUFBSTtBQUNYLGdCQUFNLEVBQUUsSUFBSTtBQUNaLGVBQUssRUFBRSxLQUFLO0FBQ1osY0FBSSxFQUFFLEVBQUcsRUFDVixDQUFBO0FBQ0QsWUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNuQyxZQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUNsQyxVQUFFLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQTtBQUN0QixZQUFJLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRTtBQUNyQyxjQUFJLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7U0FDOUI7QUFDRCxlQUFPLEVBQUUsQ0FBQTtPQUNWO0tBQUEsQ0FBQztHQUFBLENBQUMsQ0FBQTs7QUFFSCxPQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxVQUFBLEVBQUU7V0FBSSxVQUFVLEtBQUssRUFBRTtBQUNyRSxVQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ3pELFdBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQ3ZELFFBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ3JCO0dBQUEsQ0FBQyxDQUFBOztBQUVGLE9BQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFVBQUEsRUFBRTtXQUFJLFVBQVUsS0FBSyxFQUFFO0FBQ2pFLFVBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDekQsV0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDdkQsUUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDckI7R0FBQSxDQUFDLENBQUE7O0FBRUYsTUFBSSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBOztBQUV2RCxPQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3JCLFNBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxVQUFBLEVBQUU7YUFBSSxVQUFVLEtBQUssRUFBRTtBQUNuRCxZQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ3pELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFBO0FBQ2xGLFlBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ3RCLGNBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtTQUM5QjtBQUNELFlBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUNuQyxlQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO09BQzVCO0tBQUEsQ0FBQyxDQUFBOztBQUVGLFNBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFBLEVBQUU7YUFBSSxVQUFVLEtBQUssRUFBRTtBQUNyRCxZQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ3pELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3hDLFlBQUksQ0FBQyxZQUFZLFVBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUMvQixlQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO09BQzVCO0tBQUEsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4REYsTUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTs7QUFFdEQsV0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7V0FBSSxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQUEsR0FBRzthQUFJLFVBQUEsRUFBRTtlQUFJLFlBQVk7QUFDaEUsY0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQTtBQUMvQixjQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDN0MsY0FBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQzdCLGNBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUM1QyxjQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ3pCLGdCQUFJLEVBQUUsSUFBSTtBQUNWLGlCQUFLLEVBQUUsSUFBSTtBQUNYLGlCQUFLLEVBQUUsS0FBSztBQUNaLGtCQUFNLEVBQUUsTUFBTSxFQUNmLENBQUMsQ0FBQTs7O0FBR0YsaUJBQU8sRUFBRSxDQUFDLEtBQUssQ0FDYixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUM1QyxTQUFTLENBQUMsQ0FBQTtTQUNiO09BQUE7S0FBQSxDQUFDO0dBQUEsQ0FBQyxDQUFBO0NBRUoiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3RyYWNlcicpXG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgYXNzaWduIGZyb20gJ29iamVjdC1hc3NpZ24nXG5pbXBvcnQgdXRpbHMgZnJvbSAnLi91dGlscydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVHJhY2VyIHtcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSBhc3NpZ24oe1xuICAgICAgZmlsdGVyRmlsZXM6IFtdLFxuICAgICAgb25WYWx1ZTogZnVuY3Rpb24oKXt9LFxuICAgICAgb25TdHJlYW06IGZ1bmN0aW9uKCl7fSxcbiAgICB9LCBjb25maWcpXG4gICAgdGhpcy5yZXNldCgpXG4gIH1cblxuICByZXNldCgpIHtcbiAgICB0aGlzLnN0cmVhbXMgPSB7fVxuICAgIC8vIHRoaXMuc2lkcyA9IHt9XG4gICAgLy8gdGhpcy5wb3NpdGlvbnMgPSBbXVxuXG4gICAgdGhpcy5hZ3JvdXBzID0gW11cbiAgICB0aGlzLl9hZyA9IC0xXG4gICAgdGhpcy5feHBvcyA9IDBcbiAgICB0aGlzLl9sYXN0ID0gbnVsbFxuXG4gICAgdGhpcy5fc2lkID0gMTBcbiAgICB0aGlzLl91aWQgPSAxMDAwXG4gIH1cblxuICBnZXRTdGFjaygpIHtcbiAgICBsZXQgZmlsdGVyRmlsZXMgPSB0aGlzLmNvbmZpZy5maWx0ZXJGaWxlc1xuICAgIHRyeSB7dGhyb3cgbmV3IEVycm9yKCl9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIC8vIGZpcnN0IHR3byBsaW5lcyBhcmUgcmlnaHQgaGVyZSwgYW5kIHRoZSBjYWxsZXIgKGZyb20gcngtdHJhY2VyLmpzKVxuICAgICAgcmV0dXJuIGUuc3RhY2suc3BsaXQoJ1xcbicpLnNsaWNlKDMsIDQpXG4gICAgICAgIC5maWx0ZXIobGluZSA9PiAhZmlsdGVyRmlsZXMuc29tZShmaWxlID0+IGxpbmUuaW5kZXhPZihmaWxlKSAhPT0gLTEpKVxuICAgICAgICAuam9pbignXFxuJykvLyAmJiBlLnN0YWNrXG4gICAgfVxuICB9XG5cbiAgcG9wdWxhdGVYcG9zKGVudHJ5KSB7XG4gICAgaWYgKGVudHJ5LmFzeW5jIHx8IHRoaXMuX2FnID09PSAtMSkgeyAvLyBuZXcgYWdyb3VwXG4gICAgICB0aGlzLmFncm91cHMucHVzaCh7XG4gICAgICAgIHNpemU6IDAsXG4gICAgICAgIHdpZHRoOiAxLFxuICAgICAgICBzdGFydDogZW50cnkudHMsXG4gICAgICAgIGluaXRpYXRvcjogZW50cnksXG4gICAgICB9KVxuICAgICAgdGhpcy5fYWcgPSB0aGlzLmFncm91cHMubGVuZ3RoIC0gMVxuICAgICAgdGhpcy5feHBvcyA9IDBcbiAgICAgIHRoaXMuX2xhc3QgPSBudWxsXG4gICAgfVxuXG4gICAgZW50cnkueHBvcyA9IHRoaXMuX3hwb3NcbiAgICBlbnRyeS5hZ3JvdXAgPSB0aGlzLl9hZ1xuICAgIHRoaXMuYWdyb3Vwc1t0aGlzLl9hZ10uc2l6ZSArPSAxXG5cbiAgICBpZiAoIXRoaXMuX2xhc3QpIHJldHVybiB0aGlzLl9sYXN0ID0gZW50cnlcblxuICAgIGxldCB7c2lkOiBsc2lkLCB0eXBlOiBsdHlwZX0gPSB0aGlzLl9sYXN0XG4gICAgaWYgKFxuICAgICAgLy8gc2FtZSBsaW5lLCBoYW5kb2ZmXG4gICAgICAoZW50cnkuc2lkID09PSBsc2lkICYmIGx0eXBlID09PSAncmVjdicgJiYgZW50cnkudHlwZSA9PT0gJ3NlbmQnKSB8fFxuICAgICAgLy8gbGF0ZXIgbGluZSwgbm8gaW50ZXJmZXJlbmNlXG4gICAgICAoZW50cnkuc2lkID4gbHNpZCAmJiBsdHlwZSAhPT0gZW50cnkudHlwZSlcbiAgICApIHtcbiAgICAgIC8vIHBhc3NcbiAgICB9IGVsc2Uge1xuICAgICAgZW50cnkueHBvcyArPSAxXG4gICAgICB0aGlzLl94cG9zICs9IDFcbiAgICAgIHRoaXMuYWdyb3Vwc1t0aGlzLl9hZ10ud2lkdGggPSB0aGlzLl94cG9zICsgMVxuICAgIH1cblxuICAgIHRoaXMuX2xhc3QgPSBlbnRyeVxuICB9XG5cbiAgZ2V0U2lkKCkge1xuICAgIHJldHVybiB0aGlzLl9zaWQrK1xuICB9XG5cbiAgZ2V0VWlkKCkge1xuICAgIHJldHVybiB0aGlzLl91aWQrK1xuICB9XG5cbiAgYWRkU3RyZWFtKHN0cmVhbSwgYXRQb3MpIHtcbiAgICBsZXQgc2lkID0gdGhpcy5nZXRTaWQoKVxuICAgIHN0cmVhbS5pZCA9IHNpZFxuICAgIHN0cmVhbS52YWx1ZXMgPSBbXVxuICAgIHN0cmVhbS5pbnN5bmMgPSBzZXRUaW1lb3V0KCgpID0+IHN0cmVhbS5pbnN5bmMgPSBudWxsLCAwKVxuICAgIC8vIGRlYnVnIHN0cmVhbSBjcmVhdGlvbiBjb25zb2xlLmxvZygnY3JlYXRlZCBzdHJlYW0nLCBzdHJlYW0pXG4gICAgdGhpcy5zdHJlYW1zW3NpZF0gPSBzdHJlYW1cbiAgICAvLyB0aGlzLmNvbmZpZy5vblN0cmVhbShzdHJlYW0pXG4gICAgaWYgKGF0UG9zKSB7XG4gICAgICAvLyB0aGlzLnBvc2l0aW9uc1xuICAgIH1cbiAgICByZXR1cm4gc2lkXG4gIH1cblxuICB0cmFjZShzaWQsIHR5cGUsIHZhbHVlKSB7XG4gICAgbGV0IHdyYXBwZWQgPSB0eXBlID09PSAncmVjdicgfHwgdHlwZSA9PT0gJ3Bhc3Mtd3JhcHBlZCdcbiAgICBsZXQgc3RyZWFtID0gdGhpcy5zdHJlYW1zW3NpZF1cblxuICAgIGlmICh3cmFwcGVkICYmICghdmFsdWUgfHwgIXZhbHVlLnVpZCkpIHtcbiAgICAgIGNvbnNvbGUud2FybignYmFkIHZhbHVlIHJlY2VpdmVkLi4uJywgc2lkLCBzdHJlYW0sIHZhbHVlKVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfVxuICAgIGxldCB1aWQgPSB3cmFwcGVkID8gdmFsdWUudWlkIDogdGhpcy5nZXRVaWQoKVxuICAgIGxldCBlbnRyeSA9IHtcbiAgICAgIHZhbHVlOiB3cmFwcGVkID8gdmFsdWUudmFsdWUgOiB2YWx1ZSxcbiAgICAgIGFzeW5jOiB0eXBlID09PSAnc2VuZCcgJiYgc3RyZWFtLmluc3luYyA9PT0gbnVsbCxcbiAgICAgIHRzOiBEYXRlLm5vdygpLFxuICAgICAgc2lkLFxuICAgICAgdHlwZSxcbiAgICAgIHVpZCxcbiAgICB9XG5cbiAgICB0aGlzLnBvcHVsYXRlWHBvcyhlbnRyeSlcblxuICAgIHN0cmVhbS52YWx1ZXMucHVzaChlbnRyeSlcbiAgICB0aGlzLmNvbmZpZy5vblZhbHVlKGVudHJ5LCBzaWQpXG4gICAgaWYgKHR5cGUgPT09ICdzZW5kJykgeyAvLyBkYXRhIGlzIGxlYXZpbmcgdGhpcyBzdHJlYW1cbiAgICAgIC8vIGRlYnVnIHdyYXAgLyB1bndyYXAgY29uc29sZS5sb2coJ3dyYXBwaW5nJywgdmFsdWUsIHVpZCwgc2lkLCBzdHJlYW0pXG4gICAgICB2YWx1ZSA9IHt2YWx1ZSwgdWlkfVxuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3JlY3YnKSB7IC8vIGRhdGEgaXMgZW50ZXJpbmcgdGhpcyBzdHJlYW1cbiAgICAgIHZhbHVlID0gdmFsdWUudmFsdWVcbiAgICAgIC8vIGRlYnVnIHdyYXAgLyB1bndyYXAgY29uc29sZS5sb2coJ3Vud3JhcHBpbmcnLCB2YWx1ZSwgdWlkLCBzaWQsIHN0cmVhbSlcbiAgICAgIGlmIChzdHJlYW0uaW5zeW5jID09PSBudWxsKSB7XG4gICAgICAgIHN0cmVhbS5pbnN5bmMgPSBzZXRUaW1lb3V0KCgpID0+IHN0cmVhbS5pbnN5bmMgPSBudWxsLCAwKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIHRyYWNlTWFwKHNpZCwgdHlwZSkge1xuICAgIGlmIChbJ3NlbmQnLCAncmVjdicsICdwYXNzJywgJ3Bhc3Mtd3JhcHBlZCddLmluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgbWFwIHR5cGU6ICcgKyB0eXBlKVxuICAgIH1cbiAgICBsZXQgdHJhY2UgPSB0aGlzLnRyYWNlLmJpbmQodGhpcywgc2lkLCB0eXBlKVxuICAgIHJldHVybiB0cmFjZVxuICB9XG5cbiAgZHVtcCgpIHtcbiAgICBsZXQgc3RyZWFtcyA9IHt9XG4gICAgbGV0IGNsZWFuVmFsdWUgPSB2YWx1ZSA9PiB7XG4gICAgICBsZXQgY2xlYW4gPSBhc3NpZ24oe30sIHZhbHVlKVxuICAgICAgY2xlYW4udmFsdWUgPSB1dGlscy5hc1N0cmluZyh2YWx1ZS52YWx1ZSkuc2xpY2UoMCwgMTAwKVxuICAgICAgcmV0dXJuIGNsZWFuXG4gICAgfVxuICAgIGZvciAobGV0IHNpZCBpbiB0aGlzLnN0cmVhbXMpIHtcbiAgICAgIGxldCBzdHJlYW0gPSB0aGlzLnN0cmVhbXNbc2lkXVxuICAgICAgc3RyZWFtc1tzaWRdID0gYXNzaWduKHt9LCBzdHJlYW0pXG4gICAgICBzdHJlYW1zW3NpZF0udmFsdWVzID0gc3RyZWFtLnZhbHVlcy5tYXAoY2xlYW5WYWx1ZSlcbiAgICAgIHN0cmVhbXNbc2lkXS5tZXRhID0gdXRpbHMuYXNTdHJpbmcoc3RyZWFtc1tzaWRdLm1ldGEpLnNsaWNlKDAsIDEwMClcbiAgICB9XG4gICAgbGV0IGdyb3VwcyA9IHRoaXMuYWdyb3Vwcy5tYXAoZ3JvdXAgPT4ge1xuICAgICAgZ3JvdXAgPSBhc3NpZ24oe30sIGdyb3VwKVxuICAgICAgZ3JvdXAuaW5pdGlhdG9yID0gYXNzaWduKHt9LCBncm91cC5pbml0aWF0b3IsIHtcbiAgICAgICAgdmFsdWU6IHV0aWxzLmFzU3RyaW5nKGdyb3VwLmluaXRpYXRvci52YWx1ZSkuc2xpY2UoMCwgMTAwKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBncm91cFxuICAgIH0pXG4gICAgcmV0dXJuIHtzdHJlYW1zLCBncm91cHN9XG4gIH1cbn1cblxuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZGVjb3JhdGUob2JqLCBhdHRyLCBkZWNvcmF0b3IpIHtcbiAgICBvYmpbYXR0cl0gPSBkZWNvcmF0b3Iob2JqW2F0dHJdKVxuICB9LFxuICBhc1N0cmluZyh2YWx1ZSkge1xuICAgIHRyeSB7cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKSArICcnfVxuICAgIGNhdGNoKGUpe31cbiAgICB0cnkge3JldHVybiB2YWx1ZSsnJ31cbiAgICBjYXRjaChlKXt9XG4gICAgcmV0dXJuICd2YWx1ZSBjYW5ub3QgYmUgcHJldmlld2VkJ1xuICB9XG59XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gVG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciBrZXlzO1xuXHR2YXIgdG8gPSBUb09iamVjdCh0YXJnZXQpO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IGFyZ3VtZW50c1tzXTtcblx0XHRrZXlzID0gT2JqZWN0LmtleXMoT2JqZWN0KGZyb20pKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG9ba2V5c1tpXV0gPSBmcm9tW2tleXNbaV1dO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCIndXNlIHN0cmljdCdcblxuaW1wb3J0IHdyYXAgZnJvbSAnLi4vd3JhcC9rZWZpcidcbmltcG9ydCBUcmFjZXIgZnJvbSAnLi4nXG5cbmZ1bmN0aW9uIG1haW4oKSB7XG4gIGlmICghd2luZG93LktlZmlyKSB7XG4gICAgY29uc29sZS53YXJuKCdnbG9iYWwgS2VmaXIgbm90IGZvdW5kIScpXG4gICAgcmV0dXJuXG4gIH1cblxuICBsZXQgdHJhY2VyID0gbmV3IFRyYWNlcih7XG4gICAgZmlsdGVyRmlsZXM6IFsna2VmaXIuanMnLCAna2VmaXJ2aXNpb24uanMnXSxcbiAgICBvblZhbHVlOiBmdW5jdGlvbiAoZW50cnksIGlkKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZygncnh2aXNpb24nLCBlbnRyeS50eXBlLCBlbnRyeS52YWx1ZSwgaWQsIGVudHJ5KVxuICAgIH1cbiAgfSlcbiAgd3JhcCh3aW5kb3cuS2VmaXIsIHRyYWNlcilcbiAgd2luZG93Ll9fcnh2aXNpb25fdHJhY2VyID0gdHJhY2VyXG5cbiAgd2luZG93LnR4RHVtcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJylcbiAgICB0LnZhbHVlID0gSlNPTi5zdHJpbmdpZnkodHJhY2VyLmR1bXAoKSlcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHQpXG4gIH1cbn1cblxuXG5tYWluKClcbiIsIid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vbGliL3V0aWxzJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB3cmFwKEtlZmlyLCB0cmFjZXIpIHtcbiAgbGV0IHNQcm90byA9IEtlZmlyLlN0cmVhbS5wcm90b3R5cGVcbiAgbGV0IHBQcm90byA9IEtlZmlyLlByb3BlcnR5LnByb3RvdHlwZVxuICBsZXQgb1Byb3RvID0gS2VmaXIuT2JzZXJ2YWJsZS5wcm90b3R5cGVcbiAgbGV0IHNNYXAgPSBzUHJvdG8ubWFwXG4gIGxldCBwTWFwID0gcFByb3RvLm1hcFxuXG4gIGZ1bmN0aW9uIGRlY29yYXRlKG5hbWUsIGRlYykge1xuICAgIHV0aWxzLmRlY29yYXRlKHNQcm90bywgbmFtZSwgZGVjKHNNYXApKVxuICAgIHV0aWxzLmRlY29yYXRlKHBQcm90bywgbmFtZSwgZGVjKHBNYXApKVxuICB9XG5cbiAgbGV0IHdyYXBwaW5nID0gWydtYXAnLCAnbWFwVG8nLCAnc2VsZWN0QnknLCAnY29tYmluZScsICdtZXJnZScsICdmbGF0TWFwJ11cblxuICB3cmFwcGluZy5mb3JFYWNoKG5hbWUgPT4gZGVjb3JhdGUobmFtZSwgbWFwID0+IGZuID0+IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgcHJldmlkID0gdGhpcy5fX3J4dmlzaW9uX2lkXG4gICAgaWYgKCFwcmV2aWQpIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IHN0YWNrID0gdHJhY2VyLmdldFN0YWNrKCkgLy8gYXJlIHdlIGluIHVzZXIgY29kZSBvciByeCBjb2RlP1xuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbSh7XG4gICAgICB0eXBlOiBuYW1lLFxuICAgICAgdGl0bGU6IG5hbWUsXG4gICAgICBzb3VyY2U6IHByZXZpZCxcbiAgICAgIHN0YWNrOiBzdGFjayxcbiAgICAgIC8vIGlzIHRoZXJlIG1ldGEgaW5mbyBvZiBpbnRlcmVzdCBoZXJlP1xuICAgIH0pXG5cbiAgICBsZXQgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuXG4gICAgbGV0IG9icyA9IG1hcC5jYWxsKFxuICAgICAgZm4uYXBwbHkoXG4gICAgICAgIG1hcC5jYWxsKHRoaXMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpLFxuICAgICAgICBhcmdzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pKVxuXG4gIC8vIGluaXRpYWxpemVyc1xuICBsZXQgaW5pdGlhbGl6ZXJzID0ge1xuICAgIGZyb21FdmVudChlbCwgZXZ0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogYFwiJHtldnR9XCIgZXZlbnRgLFxuICAgICAgICBtZXRhOiB7XG4gICAgICAgICAgZWwsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIGVtaXR0ZXI6IGZhbHNlLFxuICAgIC8vIGJ1czogZmFsc2UsXG4gICAgc2VxdWVudGlhbGx5OiBmYWxzZSxcbiAgICBsYXRlcjogZmFsc2UsXG4gIH1cbiAgT2JqZWN0LmtleXMoaW5pdGlhbGl6ZXJzKS5mb3JFYWNoKG5hbWUgPT4gdXRpbHMuZGVjb3JhdGUoS2VmaXIsIG5hbWUsIGZuID0+IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICB0eXBlOiBuYW1lLFxuICAgICAgdGl0bGU6IG5hbWUsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgICBtZXRhOiB7IH0sXG4gICAgfVxuICAgIGlmIChpbml0aWFsaXplcnNbbmFtZV0pIHtcbiAgICAgIGxldCBleHRyYSA9IGluaXRpYWxpemVyc1tuYW1lXS5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgICBmb3IgKGxldCBhdHRyIGluIGV4dHJhKSB7XG4gICAgICAgIG9wdGlvbnNbYXR0cl0gPSBleHRyYVthdHRyXVxuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbShvcHRpb25zKVxuICAgIGxldCBvYnMgPSBzTWFwLmNhbGwoXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLFxuICAgICAgdHJhY2VyLnRyYWNlTWFwKHNpZCwgJ3NlbmQnKVxuICAgIClcbiAgICBvYnMuX19yeHZpc2lvbl9pZCA9IHNpZFxuICAgIHJldHVybiBvYnNcbiAgfSkpXG5cbiAgdXRpbHMuZGVjb3JhdGUoS2VmaXIsICdlbWl0dGVyJywgZm4gPT4gZnVuY3Rpb24gKGVsLCBldnQpIHtcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICB0eXBlOiAnZW1pdHRlcicsXG4gICAgICB0aXRsZTogJ2VtaXR0ZXInLFxuICAgICAgc291cmNlOiBudWxsLFxuICAgICAgc3RhY2s6IHN0YWNrLFxuICAgICAgbWV0YTogeyB9LFxuICAgIH1cbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbShvcHRpb25zKVxuICAgIGxldCBlbSA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBlbS5fX3J4dmlzaW9uX2lkID0gc2lkXG4gICAgcmV0dXJuIGVtXG4gIH0pXG5cbiAgbGV0IGVtaXR0ZXJMaWtlID0gWydlbWl0dGVyJywgJ3Bvb2wnLCAnYnVzJ11cblxuICBlbWl0dGVyTGlrZS5tYXAobmFtZSA9PiB1dGlscy5kZWNvcmF0ZShLZWZpciwgbmFtZSwgZm4gPT4gZnVuY3Rpb24gKGVsLCBldnQpIHtcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICB0eXBlOiBuYW1lLFxuICAgICAgdGl0bGU6IG5hbWUsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgICBtZXRhOiB7IH0sXG4gICAgfVxuICAgIGxldCBzaWQgPSB0cmFjZXIuYWRkU3RyZWFtKG9wdGlvbnMpXG4gICAgbGV0IGVtID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIGVtLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICBpZiAobmFtZSA9PT0gJ2J1cycgfHwgbmFtZSA9PT0gJ3Bvb2wnKSB7XG4gICAgICB0aGlzLl9yeHZfcGx1Z21hcCA9IG5ldyBNYXAoKVxuICAgIH1cbiAgICByZXR1cm4gZW1cbiAgfSkpXG5cbiAgdXRpbHMuZGVjb3JhdGUoS2VmaXIuRW1pdHRlci5wcm90b3R5cGUsICdlbWl0JywgZm4gPT4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLl9fcnh2aXNpb25faWQpIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgdmFsdWUgPSB0cmFjZXIudHJhY2UodGhpcy5fX3J4dmlzaW9uX2lkLCAnc2VuZCcsIHZhbHVlKVxuICAgIGZuLmNhbGwodGhpcywgdmFsdWUpXG4gIH0pXG5cbiAgdXRpbHMuZGVjb3JhdGUoS2VmaXIuQnVzLnByb3RvdHlwZSwgJ2VtaXQnLCBmbiA9PiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuX19yeHZpc2lvbl9pZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB2YWx1ZSA9IHRyYWNlci50cmFjZSh0aGlzLl9fcnh2aXNpb25faWQsICdzZW5kJywgdmFsdWUpXG4gICAgZm4uY2FsbCh0aGlzLCB2YWx1ZSlcbiAgfSlcblxuICBsZXQgcG9vbHMgPSBbS2VmaXIuQnVzLnByb3RvdHlwZSwgS2VmaXIuUG9vbC5wcm90b3R5cGVdXG5cbiAgcG9vbHMuZm9yRWFjaChwcm90byA9PiB7XG4gICAgdXRpbHMuZGVjb3JhdGUocHJvdG8sICdwbHVnJywgZm4gPT4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoIXRoaXMuX19yeHZpc2lvbl9pZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIGxldCBvdGhlciA9IHNNYXAuYXBwbHkodmFsdWUsIHRyYWNlci50cmFjZU1hcCh0aGlzLl9fcnh2aXNpb25faWQsICdwYXNzLXdyYXBwZWQnKSlcbiAgICAgIGlmICghdGhpcy5fcnh2X3BsdWdtYXApIHtcbiAgICAgICAgdGhpcy5fcnh2X3BsdWdtYXAgPSBuZXcgTWFwKClcbiAgICAgIH1cbiAgICAgIHRoaXMuX3J4dl9wbHVnbWFwLnNldCh2YWx1ZSwgb3RoZXIpXG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBvdGhlcilcbiAgICB9KVxuXG4gICAgdXRpbHMuZGVjb3JhdGUocHJvdG8sICd1bnBsdWcnLCBmbiA9PiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIGlmICghdGhpcy5fX3J4dmlzaW9uX2lkKSByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgbGV0IG90aGVyID0gdGhpcy5fcnh2X3BsdWdtYXAuZ2V0KHZhbHVlKVxuICAgICAgdGhpcy5fcnh2X3BsdWdtYXAuZGVsZXRlKHZhbHVlKVxuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgb3RoZXIpXG4gICAgfSlcbiAgfSlcblxuICAvKlxuICB1dGlscy5kZWNvcmF0ZShLZWZpciwgJ2Zyb21FdmVudCcsIGZuID0+IGZ1bmN0aW9uIChlbCwgZXZ0KSB7XG4gICAgbGV0IHN0YWNrID0gdHJhY2VyLmdldFN0YWNrKClcbiAgICBpZiAoIXN0YWNrKSByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIGxldCBzaWQgPSB0cmFjZXIuYWRkU3RyZWFtKHtcbiAgICAgIHR5cGU6ICdmcm9tRXZlbnQnLFxuICAgICAgdGl0bGU6IGBcIiR7ZXZ0fVwiIGV2ZW50YCxcbiAgICAgIHNvdXJjZTogbnVsbCxcbiAgICAgIHN0YWNrOiBzdGFjayxcbiAgICAgIG1ldGE6IHtcbiAgICAgICAgZWw6IGFyZ3VtZW50c1swXSxcbiAgICAgIH0sXG4gICAgfSlcbiAgICBsZXQgb2JzID0gc01hcC5jYWxsKFxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pXG5cbiAgdXRpbHMuZGVjb3JhdGUoS2VmaXIsICdlbWl0dGVyJywgZm4gPT4gZnVuY3Rpb24gKCkge1xuICAgIGxldCBzdGFjayA9IHRyYWNlci5nZXRTdGFjaygpXG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbSh7XG4gICAgICB0eXBlOiAnZW1pdHRlcicsXG4gICAgICB0aXRsZTogJ2N1c3RvbSBlbWl0dGVyJyxcbiAgICAgIHNvdXJjZTogbnVsbCxcbiAgICAgIHN0YWNrOiBzdGFjayxcbiAgICAgIG1ldGE6IHtcbiAgICAgIH0sXG4gICAgfSlcbiAgICBsZXQgb2JzID0gc01hcC5jYWxsKFxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pXG5cbiAgdXRpbHMuZGVjb3JhdGUoS2VmaXIsICdidXMnLCBmbiA9PiBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHN0YWNrID0gdHJhY2VyLmdldFN0YWNrKClcbiAgICBpZiAoIXN0YWNrKSByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIGxldCBzaWQgPSB0cmFjZXIuYWRkU3RyZWFtKHtcbiAgICAgIHR5cGU6ICdidXMnLFxuICAgICAgdGl0bGU6ICdjdXN0b20gYnVzJyxcbiAgICAgIHNvdXJjZTogbnVsbCxcbiAgICAgIHN0YWNrOiBzdGFjayxcbiAgICAgIG1ldGE6IHtcbiAgICAgIH0sXG4gICAgfSlcbiAgICBsZXQgb2JzID0gc01hcC5jYWxsKFxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pXG4gICovXG5cbiAgbGV0IHJlY2VpdmVycyA9IFsnbG9nJywgJ29uVmFsdWUnLCAnb25BbnknLCAnb25FcnJvciddXG5cbiAgcmVjZWl2ZXJzLmZvckVhY2gobmFtZSA9PiBkZWNvcmF0ZShuYW1lLCBtYXAgPT4gZm4gPT4gZnVuY3Rpb24gKCkge1xuICAgIGxldCBwcmV2aWQgPSB0aGlzLl9fcnh2aXNpb25faWRcbiAgICBpZiAoIXByZXZpZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IHNpZCA9IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgdHlwZTogbmFtZSxcbiAgICAgIHRpdGxlOiBuYW1lLFxuICAgICAgc3RhY2s6IHN0YWNrLFxuICAgICAgc291cmNlOiBwcmV2aWQsXG4gICAgfSlcblxuICAgIC8vIFRPRE8oamFyZWQpOiBsb2cgZXJyb3JzLCBjb21wbGV0aW9uc1xuICAgIHJldHVybiBmbi5hcHBseShcbiAgICAgIG1hcC5jYWxsKHRoaXMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpLFxuICAgICAgYXJndW1lbnRzKVxuICB9KSlcblxufVxuIl19

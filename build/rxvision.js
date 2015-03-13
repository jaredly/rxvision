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

},{}],"/home/jared/clone/rxvision/run/rx.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var wrap = _interopRequire(require("../wrap/rx"));

var Tracer = _interopRequire(require(".."));

function main() {
  if (!window.Rx) {
    console.warn("global Rx not found!");
    return;
  }

  var tracer = new Tracer({
    filterFiles: ["rx.all.js", "rxvision.js"],
    onValue: function onValue(entry, id) {}
  });
  wrap(window.Rx, tracer);
  window.__rxvision_tracer = tracer;

  window.txDump = function () {
    var t = document.createElement("textarea");
    t.value = JSON.stringify(tracer.dump());
    document.body.appendChild(t);
  };
}

main();

// console.log('rxvision', entry.type, entry.value, id, entry)

},{"..":"/home/jared/clone/rxvision/index.js","../wrap/rx":"/home/jared/clone/rxvision/wrap/rx.js"}],"/home/jared/clone/rxvision/wrap/rx.js":[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

module.exports = wrap;

var utils = _interopRequire(require("../lib/utils"));

function wrap(Rx, tracer) {
  var oProto = Rx.Observable.prototype;
  var oMap = oProto.map;

  // decorate fromEvent
  utils.decorate(Rx.Observable, "fromEvent", function (fn) {
    return function (el, evt) {
      var stack = tracer.getStack();
      if (!stack) return fn.apply(this, arguments);
      var sid = tracer.addStream({
        type: "fromEvent",
        title: "\"" + evt + "\" event",
        source: null,
        stack: stack,
        meta: {
          el: arguments[0] } });
      var obs = oMap.call(fn.apply(this, arguments), tracer.traceMap(sid, "send"));
      obs.__rxvision_id = sid;
      return obs;
    };
  });

  // decorate fromArray
  utils.decorate(Rx.Observable, "fromArray", function (fn) {
    return function (arr) {
      var stack = tracer.getStack();
      if (!stack) return fn.apply(this, arguments);
      var sid = tracer.addStream({
        type: "fromArray",
        title: "from array (ln " + arr.length + ")",
        source: null,
        stack: stack,
        meta: {
          array: arr } });
      var obs = oMap.call(fn.apply(this, arguments), tracer.traceMap(sid, "send"));
      obs.__rxvision_id = sid;
      return obs;
    };
  });

  // decorate fromEvent
  utils.decorate(Rx.Observable, "create", function (fn) {
    return function () {
      var stack = tracer.getStack();
      if (!stack) return fn.apply(this, arguments);
      var sid = tracer.addStream({
        type: "create",
        title: "create",
        source: null,
        stack: stack });
      var obs = oMap.call(fn.apply(this, arguments), tracer.traceMap(sid, "send"));
      obs.__rxvision_id = sid;
      return obs;
    };
  });

  utils.decorate(oProto, "share", function (fn) {
    return function () {
      var obs = fn.apply(this, arguments);
      if (this.__rxvision_id) {
        obs.__rxvision_id = this.__rxvision_id;
        tracer.streams[this.__rxvision_id].hot = true;
      }
      return obs;
    };
  });

  //TODO(jared): should we just wrap everything?
  var wrapping = ["map", "flatMap", "select", "startWith", "combineLatest", "merge"];
  wrapping.forEach(function (name) {
    return utils.decorate(oProto, name, function (fn) {
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

        // item specific things
        if (name === "merge") {
          if ("number" !== typeof args[0]) {
            var other = args[0];
            var isWrapped = !!other.__rxvision_id;
            other.__rxvision_id = other.__rxvision_id || tracer.addStream({
              type: "merge",
              title: "from merge with " + previd,
              source: null,
              stack: null,
              meta: {
                mergedWith: previd,
                result: sid } });

            args[0] = oMap.call(other, tracer.traceMap(sid, isWrapped ? "recv" : "pass"));
          }
        } else if (name === "combineLatest") {
          for (var i = 0; i < args.length - 1; i++) {
            if (Array.isArray(args[i])) continue; // TODO(jared): deal
            var old = args[i];
            var isWrapped = !!old.__rxvision_id;
            old.__rxvision_id = old.__rxvision_id || tracer.addStream({
              type: "combineLatest",
              title: "from combineLatest with " + previd,
              source: null,
              stack: null,
              meta: {
                combinedWith: previd,
                result: sid } });
            args[i] = oMap.call(old, tracer.traceMap(sid, isWrapped ? "recv" : "pass"));
          }
        } else if (name === "flatMap") {
          (function () {
            var mapper = args[0];
            args[0] = function () {
              var full = arguments[0];
              arguments[0] = arguments[0].value;
              var childObs = mapper.apply(this, arguments);
              if (childObs.__rxvision_id) {
                tracer.trace(childObs.__rxvision_id, "recv", full);
              }
              return oMap.call(childObs, tracer.traceMap(sid, "recv"));
            }
            // args[0] = oMap.call(args[0], tracer.traceMap(sid, 'recv'))
            ;
          })();
        }

        var obs = oMap.call(fn.apply(name === "flatMap" ? this : oMap.call(this, tracer.traceMap(sid, "recv")), args), tracer.traceMap(sid, "send"));
        obs.__rxvision_id = sid;
        return obs;
      };
    });
  });

  utils.decorate(oProto, "subscribe", function (fn) {
    return function (onValue, onErr, onComp) {
      if (!onValue || typeof onValue !== "function") return fn.apply(this, arguments);
      var previd = this.__rxvision_id;
      if (!previd) return fn.apply(this, arguments);
      var stack = tracer.getStack();
      if (!stack) return fn.apply(this, arguments);
      var sid = tracer.addStream({
        type: "subscribe",
        title: "subscription",
        stack: stack,
        source: previd });

      // TODO(jared): log errors, completions
      return fn.apply(oMap.call(this, tracer.traceMap(sid, "recv")), arguments);
    };
  });
}

// is there meta info of interest here?

},{"../lib/utils":"/home/jared/clone/rxvision/lib/utils.js"}]},{},["/home/jared/clone/rxvision/run/rx.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdjAuMTAuMzMvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vaW5kZXguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi9saWIvdHJhY2VyLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vbGliL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi9ydW4vcnguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi93cmFwL3J4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7SUNDakMsTUFBTSwyQkFBTSxlQUFlOztJQUMzQixLQUFLLDJCQUFNLFNBQVM7O0lBRU4sTUFBTTtBQUNkLFdBRFEsTUFBTSxDQUNiLE1BQU07MEJBREMsTUFBTTs7QUFFdkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDbkIsaUJBQVcsRUFBRSxFQUFFO0FBQ2YsYUFBTyxFQUFFLG1CQUFVLEVBQUU7QUFDckIsY0FBUSxFQUFFLG9CQUFVLEVBQUUsRUFDdkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUNWLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtHQUNiOzt1QkFSa0IsTUFBTTtBQVV6QixTQUFLO2FBQUEsaUJBQUc7QUFDTixZQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTs7OztBQUlqQixZQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtBQUNqQixZQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ2IsWUFBSSxDQUFDLEtBQUss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YUFBYSxHQUFHLEdBQUcsQ0FBQTtBQUN2QixlQUFPLEdBQUcsQ0FBQTtPQUNYO0tBQUEsQ0FBQztHQUFBLENBQUMsQ0FBQTs7QUFFSCxPQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsVUFBQSxFQUFFO1dBQUksVUFBVSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUMxRSxVQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sT0FBTyxLQUFLLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQy9FLFVBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUE7QUFDL0IsVUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQzdDLFVBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQTtBQUM3QixVQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDNUMsVUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUN6QixZQUFJLEVBQUUsV0FBVztBQUNqQixhQUFLLEVBQUUsY0FBYztBQUNyQixhQUFLLEVBQUUsS0FBSztBQUNaLGNBQU0sRUFBRSxNQUFNLEVBQ2YsQ0FBQyxDQUFBOzs7QUFHRixhQUFPLEVBQUUsQ0FBQyxLQUFLLENBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFDN0MsU0FBUyxDQUFDLENBQUE7S0FDYjtHQUFBLENBQUMsQ0FBQTtDQUNIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi90cmFjZXInKVxuXG4iLCIndXNlIHN0cmljdCdcblxuaW1wb3J0IGFzc2lnbiBmcm9tICdvYmplY3QtYXNzaWduJ1xuaW1wb3J0IHV0aWxzIGZyb20gJy4vdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRyYWNlciB7XG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gYXNzaWduKHtcbiAgICAgIGZpbHRlckZpbGVzOiBbXSxcbiAgICAgIG9uVmFsdWU6IGZ1bmN0aW9uKCl7fSxcbiAgICAgIG9uU3RyZWFtOiBmdW5jdGlvbigpe30sXG4gICAgfSwgY29uZmlnKVxuICAgIHRoaXMucmVzZXQoKVxuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5zdHJlYW1zID0ge31cbiAgICAvLyB0aGlzLnNpZHMgPSB7fVxuICAgIC8vIHRoaXMucG9zaXRpb25zID0gW11cblxuICAgIHRoaXMuYWdyb3VwcyA9IFtdXG4gICAgdGhpcy5fYWcgPSAtMVxuICAgIHRoaXMuX3hwb3MgPSAwXG4gICAgdGhpcy5fbGFzdCA9IG51bGxcblxuICAgIHRoaXMuX3NpZCA9IDEwXG4gICAgdGhpcy5fdWlkID0gMTAwMFxuICB9XG5cbiAgZ2V0U3RhY2soKSB7XG4gICAgbGV0IGZpbHRlckZpbGVzID0gdGhpcy5jb25maWcuZmlsdGVyRmlsZXNcbiAgICB0cnkge3Rocm93IG5ldyBFcnJvcigpfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAvLyBmaXJzdCB0d28gbGluZXMgYXJlIHJpZ2h0IGhlcmUsIGFuZCB0aGUgY2FsbGVyIChmcm9tIHJ4LXRyYWNlci5qcylcbiAgICAgIHJldHVybiBlLnN0YWNrLnNwbGl0KCdcXG4nKS5zbGljZSgzLCA0KVxuICAgICAgICAuZmlsdGVyKGxpbmUgPT4gIWZpbHRlckZpbGVzLnNvbWUoZmlsZSA9PiBsaW5lLmluZGV4T2YoZmlsZSkgIT09IC0xKSlcbiAgICAgICAgLmpvaW4oJ1xcbicpLy8gJiYgZS5zdGFja1xuICAgIH1cbiAgfVxuXG4gIHBvcHVsYXRlWHBvcyhlbnRyeSkge1xuICAgIGlmIChlbnRyeS5hc3luYyB8fCB0aGlzLl9hZyA9PT0gLTEpIHsgLy8gbmV3IGFncm91cFxuICAgICAgdGhpcy5hZ3JvdXBzLnB1c2goe1xuICAgICAgICBzaXplOiAwLFxuICAgICAgICB3aWR0aDogMSxcbiAgICAgICAgc3RhcnQ6IGVudHJ5LnRzLFxuICAgICAgICBpbml0aWF0b3I6IGVudHJ5LFxuICAgICAgfSlcbiAgICAgIHRoaXMuX2FnID0gdGhpcy5hZ3JvdXBzLmxlbmd0aCAtIDFcbiAgICAgIHRoaXMuX3hwb3MgPSAwXG4gICAgICB0aGlzLl9sYXN0ID0gbnVsbFxuICAgIH1cblxuICAgIGVudHJ5Lnhwb3MgPSB0aGlzLl94cG9zXG4gICAgZW50cnkuYWdyb3VwID0gdGhpcy5fYWdcbiAgICB0aGlzLmFncm91cHNbdGhpcy5fYWddLnNpemUgKz0gMVxuXG4gICAgaWYgKCF0aGlzLl9sYXN0KSByZXR1cm4gdGhpcy5fbGFzdCA9IGVudHJ5XG5cbiAgICBsZXQge3NpZDogbHNpZCwgdHlwZTogbHR5cGV9ID0gdGhpcy5fbGFzdFxuICAgIGlmIChcbiAgICAgIC8vIHNhbWUgbGluZSwgaGFuZG9mZlxuICAgICAgKGVudHJ5LnNpZCA9PT0gbHNpZCAmJiBsdHlwZSA9PT0gJ3JlY3YnICYmIGVudHJ5LnR5cGUgPT09ICdzZW5kJykgfHxcbiAgICAgIC8vIGxhdGVyIGxpbmUsIG5vIGludGVyZmVyZW5jZVxuICAgICAgKGVudHJ5LnNpZCA+IGxzaWQgJiYgbHR5cGUgIT09IGVudHJ5LnR5cGUpXG4gICAgKSB7XG4gICAgICAvLyBwYXNzXG4gICAgfSBlbHNlIHtcbiAgICAgIGVudHJ5Lnhwb3MgKz0gMVxuICAgICAgdGhpcy5feHBvcyArPSAxXG4gICAgICB0aGlzLmFncm91cHNbdGhpcy5fYWddLndpZHRoID0gdGhpcy5feHBvcyArIDFcbiAgICB9XG5cbiAgICB0aGlzLl9sYXN0ID0gZW50cnlcbiAgfVxuXG4gIGdldFNpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2lkKytcbiAgfVxuXG4gIGdldFVpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdWlkKytcbiAgfVxuXG4gIGFkZFN0cmVhbShzdHJlYW0sIGF0UG9zKSB7XG4gICAgbGV0IHNpZCA9IHRoaXMuZ2V0U2lkKClcbiAgICBzdHJlYW0uaWQgPSBzaWRcbiAgICBzdHJlYW0udmFsdWVzID0gW11cbiAgICBzdHJlYW0uaW5zeW5jID0gc2V0VGltZW91dCgoKSA9PiBzdHJlYW0uaW5zeW5jID0gbnVsbCwgMClcbiAgICAvLyBkZWJ1ZyBzdHJlYW0gY3JlYXRpb24gY29uc29sZS5sb2coJ2NyZWF0ZWQgc3RyZWFtJywgc3RyZWFtKVxuICAgIHRoaXMuc3RyZWFtc1tzaWRdID0gc3RyZWFtXG4gICAgLy8gdGhpcy5jb25maWcub25TdHJlYW0oc3RyZWFtKVxuICAgIGlmIChhdFBvcykge1xuICAgICAgLy8gdGhpcy5wb3NpdGlvbnNcbiAgICB9XG4gICAgcmV0dXJuIHNpZFxuICB9XG5cbiAgdHJhY2Uoc2lkLCB0eXBlLCB2YWx1ZSkge1xuICAgIGxldCB3cmFwcGVkID0gdHlwZSA9PT0gJ3JlY3YnIHx8IHR5cGUgPT09ICdwYXNzLXdyYXBwZWQnXG4gICAgbGV0IHN0cmVhbSA9IHRoaXMuc3RyZWFtc1tzaWRdXG5cbiAgICBpZiAod3JhcHBlZCAmJiAoIXZhbHVlIHx8ICF2YWx1ZS51aWQpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2JhZCB2YWx1ZSByZWNlaXZlZC4uLicsIHNpZCwgc3RyZWFtLCB2YWx1ZSlcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgICBsZXQgdWlkID0gd3JhcHBlZCA/IHZhbHVlLnVpZCA6IHRoaXMuZ2V0VWlkKClcbiAgICBsZXQgZW50cnkgPSB7XG4gICAgICB2YWx1ZTogd3JhcHBlZCA/IHZhbHVlLnZhbHVlIDogdmFsdWUsXG4gICAgICBhc3luYzogdHlwZSA9PT0gJ3NlbmQnICYmIHN0cmVhbS5pbnN5bmMgPT09IG51bGwsXG4gICAgICB0czogRGF0ZS5ub3coKSxcbiAgICAgIHNpZCxcbiAgICAgIHR5cGUsXG4gICAgICB1aWQsXG4gICAgfVxuXG4gICAgdGhpcy5wb3B1bGF0ZVhwb3MoZW50cnkpXG5cbiAgICBzdHJlYW0udmFsdWVzLnB1c2goZW50cnkpXG4gICAgdGhpcy5jb25maWcub25WYWx1ZShlbnRyeSwgc2lkKVxuICAgIGlmICh0eXBlID09PSAnc2VuZCcpIHsgLy8gZGF0YSBpcyBsZWF2aW5nIHRoaXMgc3RyZWFtXG4gICAgICAvLyBkZWJ1ZyB3cmFwIC8gdW53cmFwIGNvbnNvbGUubG9nKCd3cmFwcGluZycsIHZhbHVlLCB1aWQsIHNpZCwgc3RyZWFtKVxuICAgICAgdmFsdWUgPSB7dmFsdWUsIHVpZH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZWN2JykgeyAvLyBkYXRhIGlzIGVudGVyaW5nIHRoaXMgc3RyZWFtXG4gICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlXG4gICAgICAvLyBkZWJ1ZyB3cmFwIC8gdW53cmFwIGNvbnNvbGUubG9nKCd1bndyYXBwaW5nJywgdmFsdWUsIHVpZCwgc2lkLCBzdHJlYW0pXG4gICAgICBpZiAoc3RyZWFtLmluc3luYyA9PT0gbnVsbCkge1xuICAgICAgICBzdHJlYW0uaW5zeW5jID0gc2V0VGltZW91dCgoKSA9PiBzdHJlYW0uaW5zeW5jID0gbnVsbCwgMClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICB0cmFjZU1hcChzaWQsIHR5cGUpIHtcbiAgICBpZiAoWydzZW5kJywgJ3JlY3YnLCAncGFzcycsICdwYXNzLXdyYXBwZWQnXS5pbmRleE9mKHR5cGUpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIG1hcCB0eXBlOiAnICsgdHlwZSlcbiAgICB9XG4gICAgbGV0IHRyYWNlID0gdGhpcy50cmFjZS5iaW5kKHRoaXMsIHNpZCwgdHlwZSlcbiAgICByZXR1cm4gdHJhY2VcbiAgfVxuXG4gIGR1bXAoKSB7XG4gICAgbGV0IHN0cmVhbXMgPSB7fVxuICAgIGxldCBjbGVhblZhbHVlID0gdmFsdWUgPT4ge1xuICAgICAgbGV0IGNsZWFuID0gYXNzaWduKHt9LCB2YWx1ZSlcbiAgICAgIGNsZWFuLnZhbHVlID0gdXRpbHMuYXNTdHJpbmcodmFsdWUudmFsdWUpLnNsaWNlKDAsIDEwMClcbiAgICAgIHJldHVybiBjbGVhblxuICAgIH1cbiAgICBmb3IgKGxldCBzaWQgaW4gdGhpcy5zdHJlYW1zKSB7XG4gICAgICBsZXQgc3RyZWFtID0gdGhpcy5zdHJlYW1zW3NpZF1cbiAgICAgIHN0cmVhbXNbc2lkXSA9IGFzc2lnbih7fSwgc3RyZWFtKVxuICAgICAgc3RyZWFtc1tzaWRdLnZhbHVlcyA9IHN0cmVhbS52YWx1ZXMubWFwKGNsZWFuVmFsdWUpXG4gICAgICBzdHJlYW1zW3NpZF0ubWV0YSA9IHV0aWxzLmFzU3RyaW5nKHN0cmVhbXNbc2lkXS5tZXRhKS5zbGljZSgwLCAxMDApXG4gICAgfVxuICAgIGxldCBncm91cHMgPSB0aGlzLmFncm91cHMubWFwKGdyb3VwID0+IHtcbiAgICAgIGdyb3VwID0gYXNzaWduKHt9LCBncm91cClcbiAgICAgIGdyb3VwLmluaXRpYXRvciA9IGFzc2lnbih7fSwgZ3JvdXAuaW5pdGlhdG9yLCB7XG4gICAgICAgIHZhbHVlOiB1dGlscy5hc1N0cmluZyhncm91cC5pbml0aWF0b3IudmFsdWUpLnNsaWNlKDAsIDEwMClcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZ3JvdXBcbiAgICB9KVxuICAgIHJldHVybiB7c3RyZWFtcywgZ3JvdXBzfVxuICB9XG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGRlY29yYXRlKG9iaiwgYXR0ciwgZGVjb3JhdG9yKSB7XG4gICAgb2JqW2F0dHJdID0gZGVjb3JhdG9yKG9ialthdHRyXSlcbiAgfSxcbiAgYXNTdHJpbmcodmFsdWUpIHtcbiAgICB0cnkge3JldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgKyAnJ31cbiAgICBjYXRjaChlKXt9XG4gICAgdHJ5IHtyZXR1cm4gdmFsdWUrJyd9XG4gICAgY2F0Y2goZSl7fVxuICAgIHJldHVybiAndmFsdWUgY2Fubm90IGJlIHByZXZpZXdlZCdcbiAgfVxufVxuXG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIga2V5cztcblx0dmFyIHRvID0gVG9PYmplY3QodGFyZ2V0KTtcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBhcmd1bWVudHNbc107XG5cdFx0a2V5cyA9IE9iamVjdC5rZXlzKE9iamVjdChmcm9tKSk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRvW2tleXNbaV1dID0gZnJvbVtrZXlzW2ldXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB3cmFwIGZyb20gJy4uL3dyYXAvcngnXG5pbXBvcnQgVHJhY2VyIGZyb20gJy4uJ1xuXG5mdW5jdGlvbiBtYWluKCkge1xuICBpZiAoIXdpbmRvdy5SeCkge1xuICAgIGNvbnNvbGUud2FybignZ2xvYmFsIFJ4IG5vdCBmb3VuZCEnKVxuICAgIHJldHVyblxuICB9XG5cbiAgbGV0IHRyYWNlciA9IG5ldyBUcmFjZXIoe1xuICAgIGZpbHRlckZpbGVzOiBbJ3J4LmFsbC5qcycsICdyeHZpc2lvbi5qcyddLFxuICAgIG9uVmFsdWU6IGZ1bmN0aW9uIChlbnRyeSwgaWQpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdyeHZpc2lvbicsIGVudHJ5LnR5cGUsIGVudHJ5LnZhbHVlLCBpZCwgZW50cnkpXG4gICAgfVxuICB9KVxuICB3cmFwKHdpbmRvdy5SeCwgdHJhY2VyKVxuICB3aW5kb3cuX19yeHZpc2lvbl90cmFjZXIgPSB0cmFjZXJcblxuICB3aW5kb3cudHhEdW1wID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKVxuICAgIHQudmFsdWUgPSBKU09OLnN0cmluZ2lmeSh0cmFjZXIuZHVtcCgpKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodClcbiAgfVxufVxuXG5cbm1haW4oKVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB1dGlscyBmcm9tICcuLi9saWIvdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHdyYXAoUngsIHRyYWNlcikge1xuICBsZXQgb1Byb3RvID0gUnguT2JzZXJ2YWJsZS5wcm90b3R5cGVcbiAgbGV0IG9NYXAgPSBvUHJvdG8ubWFwXG5cbiAgLy8gZGVjb3JhdGUgZnJvbUV2ZW50XG4gIHV0aWxzLmRlY29yYXRlKFJ4Lk9ic2VydmFibGUsICdmcm9tRXZlbnQnLCBmbiA9PiBmdW5jdGlvbiAoZWwsIGV2dCkge1xuICAgIGxldCBzdGFjayA9IHRyYWNlci5nZXRTdGFjaygpXG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbSh7XG4gICAgICB0eXBlOiAnZnJvbUV2ZW50JyxcbiAgICAgIHRpdGxlOiBgXCIke2V2dH1cIiBldmVudGAsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgICBtZXRhOiB7XG4gICAgICAgIGVsOiBhcmd1bWVudHNbMF0sXG4gICAgICB9LFxuICAgIH0pXG4gICAgbGV0IG9icyA9IG9NYXAuY2FsbChcbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksXG4gICAgICB0cmFjZXIudHJhY2VNYXAoc2lkLCAnc2VuZCcpXG4gICAgKVxuICAgIG9icy5fX3J4dmlzaW9uX2lkID0gc2lkXG4gICAgcmV0dXJuIG9ic1xuICB9KVxuXG4gIC8vIGRlY29yYXRlIGZyb21BcnJheVxuICB1dGlscy5kZWNvcmF0ZShSeC5PYnNlcnZhYmxlLCAnZnJvbUFycmF5JywgZm4gPT4gZnVuY3Rpb24gKGFycikge1xuICAgIGxldCBzdGFjayA9IHRyYWNlci5nZXRTdGFjaygpXG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbSh7XG4gICAgICB0eXBlOiAnZnJvbUFycmF5JyxcbiAgICAgIHRpdGxlOiBgZnJvbSBhcnJheSAobG4gJHthcnIubGVuZ3RofSlgLFxuICAgICAgc291cmNlOiBudWxsLFxuICAgICAgc3RhY2s6IHN0YWNrLFxuICAgICAgbWV0YToge1xuICAgICAgICBhcnJheTogYXJyLFxuICAgICAgfSxcbiAgICB9KVxuICAgIGxldCBvYnMgPSBvTWFwLmNhbGwoXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLFxuICAgICAgdHJhY2VyLnRyYWNlTWFwKHNpZCwgJ3NlbmQnKVxuICAgIClcbiAgICBvYnMuX19yeHZpc2lvbl9pZCA9IHNpZFxuICAgIHJldHVybiBvYnNcbiAgfSlcblxuICAvLyBkZWNvcmF0ZSBmcm9tRXZlbnRcbiAgdXRpbHMuZGVjb3JhdGUoUnguT2JzZXJ2YWJsZSwgJ2NyZWF0ZScsIGZuID0+IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IHNpZCA9IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgdHlwZTogJ2NyZWF0ZScsXG4gICAgICB0aXRsZTogJ2NyZWF0ZScsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgfSlcbiAgICBsZXQgb2JzID0gb01hcC5jYWxsKFxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pXG5cbiAgdXRpbHMuZGVjb3JhdGUob1Byb3RvLCAnc2hhcmUnLCBmbiA9PiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9icyA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBpZiAodGhpcy5fX3J4dmlzaW9uX2lkKSB7XG4gICAgICBvYnMuX19yeHZpc2lvbl9pZCA9IHRoaXMuX19yeHZpc2lvbl9pZFxuICAgICAgdHJhY2VyLnN0cmVhbXNbdGhpcy5fX3J4dmlzaW9uX2lkXS5ob3QgPSB0cnVlXG4gICAgfVxuICAgIHJldHVybiBvYnNcbiAgfSlcblxuICAvL1RPRE8oamFyZWQpOiBzaG91bGQgd2UganVzdCB3cmFwIGV2ZXJ5dGhpbmc/XG4gIHZhciB3cmFwcGluZyA9IFsnbWFwJywgJ2ZsYXRNYXAnLCAnc2VsZWN0JywgJ3N0YXJ0V2l0aCcsICdjb21iaW5lTGF0ZXN0JywgJ21lcmdlJ11cbiAgd3JhcHBpbmcuZm9yRWFjaChuYW1lID0+IHV0aWxzLmRlY29yYXRlKG9Qcm90bywgbmFtZSwgZm4gPT4gZnVuY3Rpb24gKCkge1xuICAgIGxldCBwcmV2aWQgPSB0aGlzLl9fcnh2aXNpb25faWRcbiAgICBpZiAoIXByZXZpZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKSAvLyBhcmUgd2UgaW4gdXNlciBjb2RlIG9yIHJ4IGNvZGU/XG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuICAgIGxldCBzaWQgPSB0cmFjZXIuYWRkU3RyZWFtKHtcbiAgICAgIHR5cGU6IG5hbWUsXG4gICAgICB0aXRsZTogbmFtZSxcbiAgICAgIHNvdXJjZTogcHJldmlkLFxuICAgICAgc3RhY2s6IHN0YWNrLFxuICAgICAgLy8gaXMgdGhlcmUgbWV0YSBpbmZvIG9mIGludGVyZXN0IGhlcmU/XG4gICAgfSlcblxuICAgIGxldCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG5cbiAgICAvLyBpdGVtIHNwZWNpZmljIHRoaW5nc1xuICAgIGlmIChuYW1lID09PSAnbWVyZ2UnKSB7XG4gICAgICBpZiAoJ251bWJlcicgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAgIGxldCBvdGhlciA9IGFyZ3NbMF1cbiAgICAgICAgbGV0IGlzV3JhcHBlZCA9ICEhb3RoZXIuX19yeHZpc2lvbl9pZFxuICAgICAgICBvdGhlci5fX3J4dmlzaW9uX2lkID0gb3RoZXIuX19yeHZpc2lvbl9pZCB8fCB0cmFjZXIuYWRkU3RyZWFtKHtcbiAgICAgICAgICB0eXBlOiAnbWVyZ2UnLFxuICAgICAgICAgIHRpdGxlOiAnZnJvbSBtZXJnZSB3aXRoICcgKyBwcmV2aWQsXG4gICAgICAgICAgc291cmNlOiBudWxsLFxuICAgICAgICAgIHN0YWNrOiBudWxsLFxuICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgIG1lcmdlZFdpdGg6IHByZXZpZCxcbiAgICAgICAgICAgIHJlc3VsdDogc2lkLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXJnc1swXSA9IG9NYXAuY2FsbChvdGhlciwgdHJhY2VyLnRyYWNlTWFwKHNpZCwgaXNXcmFwcGVkID8gJ3JlY3YnIDogJ3Bhc3MnKSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5hbWUgPT09ICdjb21iaW5lTGF0ZXN0Jykge1xuICAgICAgZm9yIChsZXQgaT0wOyBpPGFyZ3MubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFyZ3NbaV0pKSBjb250aW51ZSAvLyBUT0RPKGphcmVkKTogZGVhbFxuICAgICAgICBsZXQgb2xkID0gYXJnc1tpXVxuICAgICAgICBsZXQgaXNXcmFwcGVkID0gISFvbGQuX19yeHZpc2lvbl9pZFxuICAgICAgICBvbGQuX19yeHZpc2lvbl9pZCA9IG9sZC5fX3J4dmlzaW9uX2lkIHx8IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgICAgIHR5cGU6ICdjb21iaW5lTGF0ZXN0JyxcbiAgICAgICAgICB0aXRsZTogJ2Zyb20gY29tYmluZUxhdGVzdCB3aXRoICcgKyBwcmV2aWQsXG4gICAgICAgICAgc291cmNlOiBudWxsLFxuICAgICAgICAgIHN0YWNrOiBudWxsLFxuICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgIGNvbWJpbmVkV2l0aDogcHJldmlkLFxuICAgICAgICAgICAgcmVzdWx0OiBzaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICAgYXJnc1tpXSA9IG9NYXAuY2FsbChvbGQsIHRyYWNlci50cmFjZU1hcChzaWQsIGlzV3JhcHBlZCA/ICdyZWN2JyA6ICdwYXNzJykpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuYW1lID09PSAnZmxhdE1hcCcpIHtcbiAgICAgIGxldCBtYXBwZXIgPSBhcmdzWzBdXG4gICAgICBhcmdzWzBdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgZnVsbCA9IGFyZ3VtZW50c1swXVxuICAgICAgICBhcmd1bWVudHNbMF0gPSBhcmd1bWVudHNbMF0udmFsdWVcbiAgICAgICAgbGV0IGNoaWxkT2JzID0gbWFwcGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgaWYgKGNoaWxkT2JzLl9fcnh2aXNpb25faWQpIHtcbiAgICAgICAgICB0cmFjZXIudHJhY2UoY2hpbGRPYnMuX19yeHZpc2lvbl9pZCwgJ3JlY3YnLCBmdWxsKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvTWFwLmNhbGwoY2hpbGRPYnMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpXG4gICAgICB9XG4gICAgICAvLyBhcmdzWzBdID0gb01hcC5jYWxsKGFyZ3NbMF0sIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpXG4gICAgfVxuXG4gICAgbGV0IG9icyA9IG9NYXAuY2FsbChcbiAgICAgIGZuLmFwcGx5KFxuICAgICAgICBuYW1lID09PSAnZmxhdE1hcCcgPyB0aGlzIDogb01hcC5jYWxsKHRoaXMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpLFxuICAgICAgICBhcmdzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pKVxuXG4gIHV0aWxzLmRlY29yYXRlKG9Qcm90bywgJ3N1YnNjcmliZScsIGZuID0+IGZ1bmN0aW9uIChvblZhbHVlLCBvbkVyciwgb25Db21wKSB7XG4gICAgaWYgKCFvblZhbHVlIHx8IHR5cGVvZiBvblZhbHVlICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIGxldCBwcmV2aWQgPSB0aGlzLl9fcnh2aXNpb25faWRcbiAgICBpZiAoIXByZXZpZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IHNpZCA9IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgdHlwZTogJ3N1YnNjcmliZScsXG4gICAgICB0aXRsZTogJ3N1YnNjcmlwdGlvbicsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgICBzb3VyY2U6IHByZXZpZCxcbiAgICB9KVxuXG4gICAgLy8gVE9ETyhqYXJlZCk6IGxvZyBlcnJvcnMsIGNvbXBsZXRpb25zXG4gICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgb01hcC5jYWxsKHRoaXMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpLFxuICAgICAgYXJndW1lbnRzKVxuICB9KVxufVxuXG4iXX0=

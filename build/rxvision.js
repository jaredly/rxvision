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

        if (this._last) {
          if (this._last.sid === entry.sid && !(this._last.type === "recv" && entry.type === "send") || this._last.sid > entry.sid) {
            //  && this._last.type === 'send' && this._last.uid !== entry.uid)) {
            entry.xpos += 1;
            this._xpos += 1;
            this.agroups[this._ag].width = this._xpos + 1;
          }
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
      value: function addStream(stream) {
        var sid = this.getSid();
        stream.id = sid;
        stream.values = [];
        stream.insync = setTimeout(function () {
          return stream.insync = null;
        }, 0);
        // debug stream creation console.log('created stream', stream)
        this.streams[sid] = stream;
        this.config.onStream(stream);
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
        return trace

        /*
        let wrapped = type === 'recv' || type === 'pass-wrapped'
        let onValue = this.config.onValue.bind(this)
        let stream = this.streams[sid]
        let getUid = this.getUid.bind(this)
        let populateXpos = this.populateXpos.bind(this)
        let clearsync = () => stream.insync = null
        return function (value) {
          if (wrapped && (!value || !value.uid)) {
            console.warn('bad value received...', sid, stream, value)
            return value
          }
          let uid = wrapped ? value.uid : getUid()
          let entry = {
            value: wrapped ? value.value : value,
            async: type === 'send' && stream.insync === null,
            ts: Date.now(),
            sid,
            type,
            uid,
          }
           populateXpos(entry)
           stream.values.push(entry)
          onValue(entry, sid)
          if (type === 'send') { // data is leaving this stream
            // debug wrap / unwrap console.log('wrapping', value, uid, sid, stream)
            value = {value, uid}
          } else if (type === 'recv') { // data is entering this stream
            value = value.value
            // debug wrap / unwrap console.log('unwrapping', value, uid, sid, stream)
            if (stream.insync === null) {
              stream.insync = setTimeout(clearsync, 0)
            }
          }
          return value
        }
        */
        ;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdjAuMTAuMzMvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vaW5kZXguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi9saWIvdHJhY2VyLmpzIiwiL2hvbWUvamFyZWQvY2xvbmUvcnh2aXNpb24vbGliL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi9ydW4vcnguanMiLCIvaG9tZS9qYXJlZC9jbG9uZS9yeHZpc2lvbi93cmFwL3J4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7SUNDakMsTUFBTSwyQkFBTSxlQUFlOztJQUMzQixLQUFLLDJCQUFNLFNBQVM7O0lBRU4sTUFBTTtBQUNkLFdBRFEsTUFBTSxDQUNiLE1BQU07MEJBREMsTUFBTTs7QUFFdkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDbkIsaUJBQVcsRUFBRSxFQUFFO0FBQ2YsYUFBTyxFQUFFLG1CQUFVLEVBQUU7QUFDckIsY0FBUSxFQUFFLG9CQUFVLEVBQUUsRUFDdkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUNWLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtHQUNiOzt1QkFSa0IsTUFBTTtBQVV6QixTQUFLO2FBQUEsaUJBQUc7QUFDTixZQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTs7QUFFakIsWUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUE7QUFDakIsWUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUNiLFlBQUksQ0FBQyxLQUFLLEdB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QUFDdkIsZUFBTyxHQUFHLENBQUE7T0FDWDtLQUFBLENBQUM7R0FBQSxDQUFDLENBQUE7O0FBRUgsT0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFVBQUEsRUFBRTtXQUFJLFVBQVUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDMUUsVUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLE9BQU8sS0FBSyxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUMvRSxVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFBO0FBQy9CLFVBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUM3QyxVQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDN0IsVUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQzVDLFVBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDekIsWUFBSSxFQUFFLFdBQVc7QUFDakIsYUFBSyxFQUFFLGNBQWM7QUFDckIsYUFBSyxFQUFFLEtBQUs7QUFDWixjQUFNLEVBQUUsTUFBTSxFQUNmLENBQUMsQ0FBQTs7O0FBR0YsYUFBTyxFQUFFLENBQUMsS0FBSyxDQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQzdDLFNBQVMsQ0FBQyxDQUFBO0tBQ2I7R0FBQSxDQUFDLENBQUE7Q0FDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvdHJhY2VyJylcblxuIiwiJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBhc3NpZ24gZnJvbSAnb2JqZWN0LWFzc2lnbidcbmltcG9ydCB1dGlscyBmcm9tICcuL3V0aWxzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmFjZXIge1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGFzc2lnbih7XG4gICAgICBmaWx0ZXJGaWxlczogW10sXG4gICAgICBvblZhbHVlOiBmdW5jdGlvbigpe30sXG4gICAgICBvblN0cmVhbTogZnVuY3Rpb24oKXt9LFxuICAgIH0sIGNvbmZpZylcbiAgICB0aGlzLnJlc2V0KClcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuc3RyZWFtcyA9IHt9XG5cbiAgICB0aGlzLmFncm91cHMgPSBbXVxuICAgIHRoaXMuX2FnID0gLTFcbiAgICB0aGlzLl94cG9zID0gMFxuICAgIHRoaXMuX2xhc3QgPSBudWxsXG5cbiAgICB0aGlzLl9zaWQgPSAxMFxuICAgIHRoaXMuX3VpZCA9IDEwMDBcbiAgfVxuXG4gIGdldFN0YWNrKCkge1xuICAgIGxldCBmaWx0ZXJGaWxlcyA9IHRoaXMuY29uZmlnLmZpbHRlckZpbGVzXG4gICAgdHJ5IHt0aHJvdyBuZXcgRXJyb3IoKX1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgLy8gZmlyc3QgdHdvIGxpbmVzIGFyZSByaWdodCBoZXJlLCBhbmQgdGhlIGNhbGxlciAoZnJvbSByeC10cmFjZXIuanMpXG4gICAgICByZXR1cm4gZS5zdGFjay5zcGxpdCgnXFxuJykuc2xpY2UoMywgNClcbiAgICAgICAgLmZpbHRlcihsaW5lID0+ICFmaWx0ZXJGaWxlcy5zb21lKGZpbGUgPT4gbGluZS5pbmRleE9mKGZpbGUpICE9PSAtMSkpXG4gICAgICAgIC5qb2luKCdcXG4nKS8vICYmIGUuc3RhY2tcbiAgICB9XG4gIH1cblxuICBwb3B1bGF0ZVhwb3MoZW50cnkpIHtcbiAgICBpZiAoZW50cnkuYXN5bmMgfHwgdGhpcy5fYWcgPT09IC0xKSB7IC8vIG5ldyBhZ3JvdXBcbiAgICAgIHRoaXMuYWdyb3Vwcy5wdXNoKHtcbiAgICAgICAgc2l6ZTogMCxcbiAgICAgICAgd2lkdGg6IDEsXG4gICAgICAgIHN0YXJ0OiBlbnRyeS50cyxcbiAgICAgICAgaW5pdGlhdG9yOiBlbnRyeSxcbiAgICAgIH0pXG4gICAgICB0aGlzLl9hZyA9IHRoaXMuYWdyb3Vwcy5sZW5ndGggLSAxXG4gICAgICB0aGlzLl94cG9zID0gMFxuICAgICAgdGhpcy5fbGFzdCA9IG51bGxcbiAgICB9XG5cbiAgICBlbnRyeS54cG9zID0gdGhpcy5feHBvc1xuICAgIGVudHJ5LmFncm91cCA9IHRoaXMuX2FnXG4gICAgdGhpcy5hZ3JvdXBzW3RoaXMuX2FnXS5zaXplICs9IDFcblxuICAgIGlmICh0aGlzLl9sYXN0KSB7XG4gICAgICBpZiAoKHRoaXMuX2xhc3Quc2lkID09PSBlbnRyeS5zaWQgJiYgISh0aGlzLl9sYXN0LnR5cGUgPT09ICdyZWN2JyAmJiBlbnRyeS50eXBlID09PSAnc2VuZCcpKSB8fFxuICAgICAgICAgICh0aGlzLl9sYXN0LnNpZCA+IGVudHJ5LnNpZCkpIHsgLy8gICYmIHRoaXMuX2xhc3QudHlwZSA9PT0gJ3NlbmQnICYmIHRoaXMuX2xhc3QudWlkICE9PSBlbnRyeS51aWQpKSB7XG4gICAgICAgIGVudHJ5Lnhwb3MgKz0gMVxuICAgICAgICB0aGlzLl94cG9zICs9IDFcbiAgICAgICAgdGhpcy5hZ3JvdXBzW3RoaXMuX2FnXS53aWR0aCA9IHRoaXMuX3hwb3MgKyAxXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdCA9IGVudHJ5XG4gIH1cblxuICBnZXRTaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NpZCsrXG4gIH1cblxuICBnZXRVaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3VpZCsrXG4gIH1cblxuICBhZGRTdHJlYW0oc3RyZWFtKSB7XG4gICAgbGV0IHNpZCA9IHRoaXMuZ2V0U2lkKClcbiAgICBzdHJlYW0uaWQgPSBzaWRcbiAgICBzdHJlYW0udmFsdWVzID0gW11cbiAgICBzdHJlYW0uaW5zeW5jID0gc2V0VGltZW91dCgoKSA9PiBzdHJlYW0uaW5zeW5jID0gbnVsbCwgMClcbiAgICAvLyBkZWJ1ZyBzdHJlYW0gY3JlYXRpb24gY29uc29sZS5sb2coJ2NyZWF0ZWQgc3RyZWFtJywgc3RyZWFtKVxuICAgIHRoaXMuc3RyZWFtc1tzaWRdID0gc3RyZWFtXG4gICAgdGhpcy5jb25maWcub25TdHJlYW0oc3RyZWFtKVxuICAgIHJldHVybiBzaWRcbiAgfVxuXG4gIHRyYWNlKHNpZCwgdHlwZSwgdmFsdWUpIHtcbiAgICBsZXQgd3JhcHBlZCA9IHR5cGUgPT09ICdyZWN2JyB8fCB0eXBlID09PSAncGFzcy13cmFwcGVkJ1xuICAgIGxldCBzdHJlYW0gPSB0aGlzLnN0cmVhbXNbc2lkXVxuXG4gICAgaWYgKHdyYXBwZWQgJiYgKCF2YWx1ZSB8fCAhdmFsdWUudWlkKSkge1xuICAgICAgY29uc29sZS53YXJuKCdiYWQgdmFsdWUgcmVjZWl2ZWQuLi4nLCBzaWQsIHN0cmVhbSwgdmFsdWUpXG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgbGV0IHVpZCA9IHdyYXBwZWQgPyB2YWx1ZS51aWQgOiB0aGlzLmdldFVpZCgpXG4gICAgbGV0IGVudHJ5ID0ge1xuICAgICAgdmFsdWU6IHdyYXBwZWQgPyB2YWx1ZS52YWx1ZSA6IHZhbHVlLFxuICAgICAgYXN5bmM6IHR5cGUgPT09ICdzZW5kJyAmJiBzdHJlYW0uaW5zeW5jID09PSBudWxsLFxuICAgICAgdHM6IERhdGUubm93KCksXG4gICAgICBzaWQsXG4gICAgICB0eXBlLFxuICAgICAgdWlkLFxuICAgIH1cblxuICAgIHRoaXMucG9wdWxhdGVYcG9zKGVudHJ5KVxuXG4gICAgc3RyZWFtLnZhbHVlcy5wdXNoKGVudHJ5KVxuICAgIHRoaXMuY29uZmlnLm9uVmFsdWUoZW50cnksIHNpZClcbiAgICBpZiAodHlwZSA9PT0gJ3NlbmQnKSB7IC8vIGRhdGEgaXMgbGVhdmluZyB0aGlzIHN0cmVhbVxuICAgICAgLy8gZGVidWcgd3JhcCAvIHVud3JhcCBjb25zb2xlLmxvZygnd3JhcHBpbmcnLCB2YWx1ZSwgdWlkLCBzaWQsIHN0cmVhbSlcbiAgICAgIHZhbHVlID0ge3ZhbHVlLCB1aWR9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAncmVjdicpIHsgLy8gZGF0YSBpcyBlbnRlcmluZyB0aGlzIHN0cmVhbVxuICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZVxuICAgICAgLy8gZGVidWcgd3JhcCAvIHVud3JhcCBjb25zb2xlLmxvZygndW53cmFwcGluZycsIHZhbHVlLCB1aWQsIHNpZCwgc3RyZWFtKVxuICAgICAgaWYgKHN0cmVhbS5pbnN5bmMgPT09IG51bGwpIHtcbiAgICAgICAgc3RyZWFtLmluc3luYyA9IHNldFRpbWVvdXQoKCkgPT4gc3RyZWFtLmluc3luYyA9IG51bGwsIDApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgdHJhY2VNYXAoc2lkLCB0eXBlKSB7XG4gICAgaWYgKFsnc2VuZCcsICdyZWN2JywgJ3Bhc3MnLCAncGFzcy13cmFwcGVkJ10uaW5kZXhPZih0eXBlKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBtYXAgdHlwZTogJyArIHR5cGUpXG4gICAgfVxuICAgIGxldCB0cmFjZSA9IHRoaXMudHJhY2UuYmluZCh0aGlzLCBzaWQsIHR5cGUpXG4gICAgcmV0dXJuIHRyYWNlXG5cbiAgICAvKlxuICAgIGxldCB3cmFwcGVkID0gdHlwZSA9PT0gJ3JlY3YnIHx8IHR5cGUgPT09ICdwYXNzLXdyYXBwZWQnXG4gICAgbGV0IG9uVmFsdWUgPSB0aGlzLmNvbmZpZy5vblZhbHVlLmJpbmQodGhpcylcbiAgICBsZXQgc3RyZWFtID0gdGhpcy5zdHJlYW1zW3NpZF1cbiAgICBsZXQgZ2V0VWlkID0gdGhpcy5nZXRVaWQuYmluZCh0aGlzKVxuICAgIGxldCBwb3B1bGF0ZVhwb3MgPSB0aGlzLnBvcHVsYXRlWHBvcy5iaW5kKHRoaXMpXG4gICAgbGV0IGNsZWFyc3luYyA9ICgpID0+IHN0cmVhbS5pbnN5bmMgPSBudWxsXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgaWYgKHdyYXBwZWQgJiYgKCF2YWx1ZSB8fCAhdmFsdWUudWlkKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ2JhZCB2YWx1ZSByZWNlaXZlZC4uLicsIHNpZCwgc3RyZWFtLCB2YWx1ZSlcbiAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICB9XG4gICAgICBsZXQgdWlkID0gd3JhcHBlZCA/IHZhbHVlLnVpZCA6IGdldFVpZCgpXG4gICAgICBsZXQgZW50cnkgPSB7XG4gICAgICAgIHZhbHVlOiB3cmFwcGVkID8gdmFsdWUudmFsdWUgOiB2YWx1ZSxcbiAgICAgICAgYXN5bmM6IHR5cGUgPT09ICdzZW5kJyAmJiBzdHJlYW0uaW5zeW5jID09PSBudWxsLFxuICAgICAgICB0czogRGF0ZS5ub3coKSxcbiAgICAgICAgc2lkLFxuICAgICAgICB0eXBlLFxuICAgICAgICB1aWQsXG4gICAgICB9XG5cbiAgICAgIHBvcHVsYXRlWHBvcyhlbnRyeSlcblxuICAgICAgc3RyZWFtLnZhbHVlcy5wdXNoKGVudHJ5KVxuICAgICAgb25WYWx1ZShlbnRyeSwgc2lkKVxuICAgICAgaWYgKHR5cGUgPT09ICdzZW5kJykgeyAvLyBkYXRhIGlzIGxlYXZpbmcgdGhpcyBzdHJlYW1cbiAgICAgICAgLy8gZGVidWcgd3JhcCAvIHVud3JhcCBjb25zb2xlLmxvZygnd3JhcHBpbmcnLCB2YWx1ZSwgdWlkLCBzaWQsIHN0cmVhbSlcbiAgICAgICAgdmFsdWUgPSB7dmFsdWUsIHVpZH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3JlY3YnKSB7IC8vIGRhdGEgaXMgZW50ZXJpbmcgdGhpcyBzdHJlYW1cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZVxuICAgICAgICAvLyBkZWJ1ZyB3cmFwIC8gdW53cmFwIGNvbnNvbGUubG9nKCd1bndyYXBwaW5nJywgdmFsdWUsIHVpZCwgc2lkLCBzdHJlYW0pXG4gICAgICAgIGlmIChzdHJlYW0uaW5zeW5jID09PSBudWxsKSB7XG4gICAgICAgICAgc3RyZWFtLmluc3luYyA9IHNldFRpbWVvdXQoY2xlYXJzeW5jLCAwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG4gICAgKi9cbiAgfVxuXG4gIGR1bXAoKSB7XG4gICAgbGV0IHN0cmVhbXMgPSB7fVxuICAgIGxldCBjbGVhblZhbHVlID0gdmFsdWUgPT4ge1xuICAgICAgbGV0IGNsZWFuID0gYXNzaWduKHt9LCB2YWx1ZSlcbiAgICAgIGNsZWFuLnZhbHVlID0gdXRpbHMuYXNTdHJpbmcodmFsdWUudmFsdWUpLnNsaWNlKDAsIDEwMClcbiAgICAgIHJldHVybiBjbGVhblxuICAgIH1cbiAgICBmb3IgKGxldCBzaWQgaW4gdGhpcy5zdHJlYW1zKSB7XG4gICAgICBsZXQgc3RyZWFtID0gdGhpcy5zdHJlYW1zW3NpZF1cbiAgICAgIHN0cmVhbXNbc2lkXSA9IGFzc2lnbih7fSwgc3RyZWFtKVxuICAgICAgc3RyZWFtc1tzaWRdLnZhbHVlcyA9IHN0cmVhbS52YWx1ZXMubWFwKGNsZWFuVmFsdWUpXG4gICAgICBzdHJlYW1zW3NpZF0ubWV0YSA9IHV0aWxzLmFzU3RyaW5nKHN0cmVhbXNbc2lkXS5tZXRhKS5zbGljZSgwLCAxMDApXG4gICAgfVxuICAgIGxldCBncm91cHMgPSB0aGlzLmFncm91cHMubWFwKGdyb3VwID0+IHtcbiAgICAgIGdyb3VwID0gYXNzaWduKHt9LCBncm91cClcbiAgICAgIGdyb3VwLmluaXRpYXRvciA9IGFzc2lnbih7fSwgZ3JvdXAuaW5pdGlhdG9yLCB7XG4gICAgICAgIHZhbHVlOiB1dGlscy5hc1N0cmluZyhncm91cC5pbml0aWF0b3IudmFsdWUpLnNsaWNlKDAsIDEwMClcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZ3JvdXBcbiAgICB9KVxuICAgIHJldHVybiB7c3RyZWFtcywgZ3JvdXBzfVxuICB9XG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGRlY29yYXRlKG9iaiwgYXR0ciwgZGVjb3JhdG9yKSB7XG4gICAgb2JqW2F0dHJdID0gZGVjb3JhdG9yKG9ialthdHRyXSlcbiAgfSxcbiAgYXNTdHJpbmcodmFsdWUpIHtcbiAgICB0cnkge3JldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgKyAnJ31cbiAgICBjYXRjaChlKXt9XG4gICAgdHJ5IHtyZXR1cm4gdmFsdWUrJyd9XG4gICAgY2F0Y2goZSl7fVxuICAgIHJldHVybiAndmFsdWUgY2Fubm90IGJlIHByZXZpZXdlZCdcbiAgfVxufVxuXG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIga2V5cztcblx0dmFyIHRvID0gVG9PYmplY3QodGFyZ2V0KTtcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBhcmd1bWVudHNbc107XG5cdFx0a2V5cyA9IE9iamVjdC5rZXlzKE9iamVjdChmcm9tKSk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRvW2tleXNbaV1dID0gZnJvbVtrZXlzW2ldXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB3cmFwIGZyb20gJy4uL3dyYXAvcngnXG5pbXBvcnQgVHJhY2VyIGZyb20gJy4uJ1xuXG5mdW5jdGlvbiBtYWluKCkge1xuICBpZiAoIXdpbmRvdy5SeCkge1xuICAgIGNvbnNvbGUud2FybignZ2xvYmFsIFJ4IG5vdCBmb3VuZCEnKVxuICAgIHJldHVyblxuICB9XG5cbiAgbGV0IHRyYWNlciA9IG5ldyBUcmFjZXIoe1xuICAgIGZpbHRlckZpbGVzOiBbJ3J4LmFsbC5qcycsICdyeHZpc2lvbi5qcyddLFxuICAgIG9uVmFsdWU6IGZ1bmN0aW9uIChlbnRyeSwgaWQpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdyeHZpc2lvbicsIGVudHJ5LnR5cGUsIGVudHJ5LnZhbHVlLCBpZCwgZW50cnkpXG4gICAgfVxuICB9KVxuICB3cmFwKHdpbmRvdy5SeCwgdHJhY2VyKVxuICB3aW5kb3cuX19yeHZpc2lvbl90cmFjZXIgPSB0cmFjZXJcblxuICB3aW5kb3cudHhEdW1wID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKVxuICAgIHQudmFsdWUgPSBKU09OLnN0cmluZ2lmeSh0cmFjZXIuZHVtcCgpKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodClcbiAgfVxufVxuXG5cbm1haW4oKVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCB1dGlscyBmcm9tICcuLi9saWIvdXRpbHMnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHdyYXAoUngsIHRyYWNlcikge1xuICBsZXQgb1Byb3RvID0gUnguT2JzZXJ2YWJsZS5wcm90b3R5cGVcbiAgbGV0IG9NYXAgPSBvUHJvdG8ubWFwXG5cbiAgLy8gZGVjb3JhdGUgZnJvbUV2ZW50XG4gIHV0aWxzLmRlY29yYXRlKFJ4Lk9ic2VydmFibGUsICdmcm9tRXZlbnQnLCBmbiA9PiBmdW5jdGlvbiAoZWwsIGV2dCkge1xuICAgIGxldCBzdGFjayA9IHRyYWNlci5nZXRTdGFjaygpXG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbSh7XG4gICAgICB0eXBlOiAnZnJvbUV2ZW50JyxcbiAgICAgIHRpdGxlOiBgXCIke2V2dH1cIiBldmVudGAsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgICBtZXRhOiB7XG4gICAgICAgIGVsOiBhcmd1bWVudHNbMF0sXG4gICAgICB9LFxuICAgIH0pXG4gICAgbGV0IG9icyA9IG9NYXAuY2FsbChcbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksXG4gICAgICB0cmFjZXIudHJhY2VNYXAoc2lkLCAnc2VuZCcpXG4gICAgKVxuICAgIG9icy5fX3J4dmlzaW9uX2lkID0gc2lkXG4gICAgcmV0dXJuIG9ic1xuICB9KVxuXG4gIC8vIGRlY29yYXRlIGZyb21BcnJheVxuICB1dGlscy5kZWNvcmF0ZShSeC5PYnNlcnZhYmxlLCAnZnJvbUFycmF5JywgZm4gPT4gZnVuY3Rpb24gKGFycikge1xuICAgIGxldCBzdGFjayA9IHRyYWNlci5nZXRTdGFjaygpXG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc2lkID0gdHJhY2VyLmFkZFN0cmVhbSh7XG4gICAgICB0eXBlOiAnZnJvbUFycmF5JyxcbiAgICAgIHRpdGxlOiBgZnJvbSBhcnJheSAobG4gJHthcnIubGVuZ3RofSlgLFxuICAgICAgc291cmNlOiBudWxsLFxuICAgICAgc3RhY2s6IHN0YWNrLFxuICAgICAgbWV0YToge1xuICAgICAgICBhcnJheTogYXJyLFxuICAgICAgfSxcbiAgICB9KVxuICAgIGxldCBvYnMgPSBvTWFwLmNhbGwoXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLFxuICAgICAgdHJhY2VyLnRyYWNlTWFwKHNpZCwgJ3NlbmQnKVxuICAgIClcbiAgICBvYnMuX19yeHZpc2lvbl9pZCA9IHNpZFxuICAgIHJldHVybiBvYnNcbiAgfSlcblxuICAvLyBkZWNvcmF0ZSBmcm9tRXZlbnRcbiAgdXRpbHMuZGVjb3JhdGUoUnguT2JzZXJ2YWJsZSwgJ2NyZWF0ZScsIGZuID0+IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IHNpZCA9IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgdHlwZTogJ2NyZWF0ZScsXG4gICAgICB0aXRsZTogJ2NyZWF0ZScsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgfSlcbiAgICBsZXQgb2JzID0gb01hcC5jYWxsKFxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pXG5cbiAgdXRpbHMuZGVjb3JhdGUob1Byb3RvLCAnc2hhcmUnLCBmbiA9PiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9icyA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBpZiAodGhpcy5fX3J4dmlzaW9uX2lkKSB7XG4gICAgICBvYnMuX19yeHZpc2lvbl9pZCA9IHRoaXMuX19yeHZpc2lvbl9pZFxuICAgICAgdHJhY2VyLnN0cmVhbXNbdGhpcy5fX3J4dmlzaW9uX2lkXS5ob3QgPSB0cnVlXG4gICAgfVxuICAgIHJldHVybiBvYnNcbiAgfSlcblxuICAvL1RPRE8oamFyZWQpOiBzaG91bGQgd2UganVzdCB3cmFwIGV2ZXJ5dGhpbmc/XG4gIHZhciB3cmFwcGluZyA9IFsnbWFwJywgJ2ZsYXRNYXAnLCAnc2VsZWN0JywgJ3N0YXJ0V2l0aCcsICdjb21iaW5lTGF0ZXN0JywgJ21lcmdlJ11cbiAgd3JhcHBpbmcuZm9yRWFjaChuYW1lID0+IHV0aWxzLmRlY29yYXRlKG9Qcm90bywgbmFtZSwgZm4gPT4gZnVuY3Rpb24gKCkge1xuICAgIGxldCBwcmV2aWQgPSB0aGlzLl9fcnh2aXNpb25faWRcbiAgICBpZiAoIXByZXZpZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKSAvLyBhcmUgd2UgaW4gdXNlciBjb2RlIG9yIHJ4IGNvZGU/XG4gICAgaWYgKCFzdGFjaykgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuICAgIGxldCBzaWQgPSB0cmFjZXIuYWRkU3RyZWFtKHtcbiAgICAgIHR5cGU6IG5hbWUsXG4gICAgICB0aXRsZTogbmFtZSxcbiAgICAgIHNvdXJjZTogcHJldmlkLFxuICAgICAgc3RhY2s6IHN0YWNrLFxuICAgICAgLy8gaXMgdGhlcmUgbWV0YSBpbmZvIG9mIGludGVyZXN0IGhlcmU/XG4gICAgfSlcblxuICAgIGxldCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG5cbiAgICAvLyBpdGVtIHNwZWNpZmljIHRoaW5nc1xuICAgIGlmIChuYW1lID09PSAnbWVyZ2UnKSB7XG4gICAgICBpZiAoJ251bWJlcicgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAgIGxldCBvdGhlciA9IGFyZ3NbMF1cbiAgICAgICAgbGV0IGlzV3JhcHBlZCA9ICEhb3RoZXIuX19yeHZpc2lvbl9pZFxuICAgICAgICBvdGhlci5fX3J4dmlzaW9uX2lkID0gb3RoZXIuX19yeHZpc2lvbl9pZCB8fCB0cmFjZXIuYWRkU3RyZWFtKHtcbiAgICAgICAgICB0eXBlOiAnbWVyZ2UnLFxuICAgICAgICAgIHRpdGxlOiAnZnJvbSBtZXJnZSB3aXRoICcgKyBwcmV2aWQsXG4gICAgICAgICAgc291cmNlOiBudWxsLFxuICAgICAgICAgIHN0YWNrOiBudWxsLFxuICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgIG1lcmdlZFdpdGg6IHByZXZpZCxcbiAgICAgICAgICAgIHJlc3VsdDogc2lkLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXJnc1swXSA9IG9NYXAuY2FsbChvdGhlciwgdHJhY2VyLnRyYWNlTWFwKHNpZCwgaXNXcmFwcGVkID8gJ3JlY3YnIDogJ3Bhc3MnKSlcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5hbWUgPT09ICdjb21iaW5lTGF0ZXN0Jykge1xuICAgICAgZm9yIChsZXQgaT0wOyBpPGFyZ3MubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGFyZ3NbaV0pKSBjb250aW51ZSAvLyBUT0RPKGphcmVkKTogZGVhbFxuICAgICAgICBsZXQgb2xkID0gYXJnc1tpXVxuICAgICAgICBsZXQgaXNXcmFwcGVkID0gISFvbGQuX19yeHZpc2lvbl9pZFxuICAgICAgICBvbGQuX19yeHZpc2lvbl9pZCA9IG9sZC5fX3J4dmlzaW9uX2lkIHx8IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgICAgIHR5cGU6ICdjb21iaW5lTGF0ZXN0JyxcbiAgICAgICAgICB0aXRsZTogJ2Zyb20gY29tYmluZUxhdGVzdCB3aXRoICcgKyBwcmV2aWQsXG4gICAgICAgICAgc291cmNlOiBudWxsLFxuICAgICAgICAgIHN0YWNrOiBudWxsLFxuICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgIGNvbWJpbmVkV2l0aDogcHJldmlkLFxuICAgICAgICAgICAgcmVzdWx0OiBzaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICAgYXJnc1tpXSA9IG9NYXAuY2FsbChvbGQsIHRyYWNlci50cmFjZU1hcChzaWQsIGlzV3JhcHBlZCA/ICdyZWN2JyA6ICdwYXNzJykpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuYW1lID09PSAnZmxhdE1hcCcpIHtcbiAgICAgIGxldCBtYXBwZXIgPSBhcmdzWzBdXG4gICAgICBhcmdzWzBdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgZnVsbCA9IGFyZ3VtZW50c1swXVxuICAgICAgICBhcmd1bWVudHNbMF0gPSBhcmd1bWVudHNbMF0udmFsdWVcbiAgICAgICAgbGV0IGNoaWxkT2JzID0gbWFwcGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgaWYgKGNoaWxkT2JzLl9fcnh2aXNpb25faWQpIHtcbiAgICAgICAgICB0cmFjZXIudHJhY2UoY2hpbGRPYnMuX19yeHZpc2lvbl9pZCwgJ3JlY3YnLCBmdWxsKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvTWFwLmNhbGwoY2hpbGRPYnMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpXG4gICAgICB9XG4gICAgICAvLyBhcmdzWzBdID0gb01hcC5jYWxsKGFyZ3NbMF0sIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpXG4gICAgfVxuXG4gICAgbGV0IG9icyA9IG9NYXAuY2FsbChcbiAgICAgIGZuLmFwcGx5KFxuICAgICAgICBuYW1lID09PSAnZmxhdE1hcCcgPyB0aGlzIDogb01hcC5jYWxsKHRoaXMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpLFxuICAgICAgICBhcmdzKSxcbiAgICAgIHRyYWNlci50cmFjZU1hcChzaWQsICdzZW5kJylcbiAgICApXG4gICAgb2JzLl9fcnh2aXNpb25faWQgPSBzaWRcbiAgICByZXR1cm4gb2JzXG4gIH0pKVxuXG4gIHV0aWxzLmRlY29yYXRlKG9Qcm90bywgJ3N1YnNjcmliZScsIGZuID0+IGZ1bmN0aW9uIChvblZhbHVlLCBvbkVyciwgb25Db21wKSB7XG4gICAgaWYgKCFvblZhbHVlIHx8IHR5cGVvZiBvblZhbHVlICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIGxldCBwcmV2aWQgPSB0aGlzLl9fcnh2aXNpb25faWRcbiAgICBpZiAoIXByZXZpZCkgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICBsZXQgc3RhY2sgPSB0cmFjZXIuZ2V0U3RhY2soKVxuICAgIGlmICghc3RhY2spIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgbGV0IHNpZCA9IHRyYWNlci5hZGRTdHJlYW0oe1xuICAgICAgdHlwZTogJ3N1YnNjcmliZScsXG4gICAgICB0aXRsZTogJ3N1YnNjcmlwdGlvbicsXG4gICAgICBzdGFjazogc3RhY2ssXG4gICAgICBzb3VyY2U6IHByZXZpZCxcbiAgICB9KVxuXG4gICAgLy8gVE9ETyhqYXJlZCk6IGxvZyBlcnJvcnMsIGNvbXBsZXRpb25zXG4gICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgb01hcC5jYWxsKHRoaXMsIHRyYWNlci50cmFjZU1hcChzaWQsICdyZWN2JykpLFxuICAgICAgYXJndW1lbnRzKVxuICB9KVxufVxuXG4iXX0=

(function(Rx) {

var proto = Rx.Observable.prototype
var map = proto.map
var id = 0

var names = ['map', 'flatMap', 'select', 'startWith', 'combineLatest', 'merge']

function make() {
  var div = document.createElement('div')
  document.body.appendChild(div)
  div.addThing = function (value, lok, cls) {
    var child = document.createElement('div')
    div.appendChild(child)
    if ('string' !== typeof value) {
      value = safe(value)
    }
    if (!lok) {
      value = ('' + value).slice(0, 100)
    }
    if (cls) {
      child.className = cls
    }
    child.innerText = value
  }
  return div
}

function get_all_things(all_thingss) {
  var res = {}
  for (var name in all_things) {
    var old = all_things[name]
    res[name] = {
      tid: old.tid,
      previf: old.previd,
      name: old.name,
      values: old.values.map(function (value) {
        return {
          value: safe(value.value).slice(0, 100),
          type: value.type,
          uid: value.uid, async: value.async, ts: value.ts}
      })
    }
  }
  return res
}


function safe(value) {
  try {return JSON.stringify(value)}
  catch(e){}
  try {return value+''}
  catch(e){}
  return 'value cannot be previewed'
}

function setupLogger(name, tid, previd) {
  var logger = make()
  logger.addThing('Stream ' + tid + ': ' + name + ' : ' + previd, true, 'title')
  var stack = getStack()
  logger.addThing(stack, true, 'stack')
  logger.nameish = name + ':' + tid + ':' + previd
  logger.thisid = tid
  logger.fromid = previd
  return logger
}

var _uid = 10000;
function uid() {
  return _uid++
}

var all_things = {}
// window.all_things = all_things

window.RxVision = {
  dump: function () {
    return get_all_things(all_things)
  },
  all_things: all_things
}

function mapit(prefix, logger, unwrap) {
  var holder
  if (!all_things[logger.thisid]) {
    holder = {
      tid: logger.thisid,
      previd: logger.fromid,
      name: logger.nameish,
      values: [],
      insync: null,
    }
    all_things[holder.tid] = holder
  } else {
    holder = all_things[logger.thisid]
  }
  function clearsync() {
    holder.insync = null
  }
  return function (value) {
    logger.addThing(prefix + ' ' + safe(value))
    //return value
    console.log('wrap', unwrap, value, logger.nameish)
    if (unwrap) {
      holder.values.push({
        type: 'recv',
        value: value.value,
        uid: value.uid,
        ts: Date.now()
      })
      value = value.value
      if (null === holder.insync) {
        holder.insync = setTimeout(clearsync, 0)
      }
    } else {
      value = {value: value, uid: uid()}
      holder.values.push({
        type: 'send',
        value: value.value,
        uid: value.uid,
        ts: Date.now(),
        async: null === holder.insync
      })
    }
    return value
  }
}









// the down and dirty

var chains = []
  , chainmap = {}


var fromEvent = Rx.Observable.fromEvent
Rx.Observable.fromEvent = function () {
  chains.push([])
  var tid = 'ee' + id++
  var logger = setupLogger('fromevent ' + arguments[1] + ' / ' + arguments[0].id + '.' + arguments[0].className, tid, null)
  var result =  map.call(fromEvent.apply(this, arguments), mapit('[e]', logger))
  result.sneakid = tid
  chainmap[result.sneakid] = chains.length - 1
  return result
}

var share = proto.share
proto.share = function () {
  var result = share.call(this, arguments)
  result.sneakid = this.sneakid
  return result
}

names.forEach(function (name) {
  var old = proto[name]
  proto[name] = function () {
    var stack = getStack()
    if (!stack || !this.sneakid) return old.apply(this, arguments)

    /* TODO uncomment this to find missing observables
    if (!this.sneakid) {
      this.sneakid = '_aa_' + id++
    }
    */

    var tid = id++
    var logger = setupLogger(name, tid, this.sneakid)

    var args = [].slice.call(arguments)
    // pick up the merging thing
    if (name === 'merge') {
      if ('number' !== typeof arguments[0]) {
        var other = args[0]
        other.sneakid = other.sneakid || '_mm_' + id++
        args[0] = map.call(other, mapit('||' + other.sneakid, logger, true))
      }
    }

    // pick up the combining thing
    if (name === 'combineLatest') {
      for (var i=0; i<args.length - 1; i++) {
        if (Array.isArray(args[i])) continue // w/e
        (function (i) {
          var old = args[i]
          old.sneakid = old.sneakid || '_cc_' + id++
          args[i] = map.call(old, mapit('<>' + old.sneakid, logger, true))
        })(i)
      }
    }

    var result =  map.call(
      old.apply(map.call(this, mapit('>', logger, true)), args),
      mapit('<', logger)
    )

    result.sneakid = tid
    return result
  }
})

function getStack() {
  try {throw new Error()}
  catch (e) {
    return e.stack.split('\n').slice(2).filter(function (line) {
      return line.indexOf('rx.all.js') === -1 && line.indexOf('sneak.js') === -1
    }).join('\n')
  }
}

var sub = proto.subscribe
proto.subscribe = function (fn, onErr, comp) {
  if (!fn || typeof fn !== 'function') return sub.apply(this, arguments)
  var stack = getStack()
  if (!stack) return sub.apply(this, arguments)
  var logger = make()
  if (!this.sneakid) {
    this.sneakid = '_ss_' + id++
  }
  var tid = id++
  logger.addThing('Subscription ' + tid + ' : ' + this.sneakid, true, 'title')
  var stack = getStack()
  logger.addThing(stack, true, 'stack')
  var args = [].slice.call(arguments)
  args[0] = function (value) {
    console.log(tid, 'got', value)
    logger.addThing(value)
    arguments[0] = value.value
    return fn.apply(this, arguments)
  }
  return sub.apply(this, args)
  /* TODO error, completion handling?
  return sub.call(this, function (value) {
    console.log(tid, 'got', value)
    logger.addThing(value)
    return fn && fn.apply(this, arguments)
  }, function (err) {
    logger.addThing('Error\n' + err.message + err.stack)
    return onErr && onErr.apply(this, arguments)
  }, function () {
    logger.addThing('done forever', tid)
    return comp && comp.apply(this, arguments)
  })
  */
}

}(Rx))

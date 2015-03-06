'use strict'

import assign from 'object-assign'
import utils from './utils'

export default class Tracer {
  constructor(config) {
    this.config = assign({
      filterFiles: [],
      onValue: function(){},
      onStream: function(){},
    }, config)
    this.streams = {}

    this.agroups = []
    this._ag = -1
    this._xpos = 0
    this._last = null

    this._sid = 10
    this._uid = 1000
  }

  getStack() {
    let filterFiles = this.config.filterFiles
    try {throw new Error()}
    catch (e) {
      // first two lines are right here, and the caller (from rx-tracer.js)
      return e.stack.split('\n').slice(3, 4)
        .filter(line => !filterFiles.some(file => line.indexOf(file) !== -1))
        .join('\n')// && e.stack
    }
  }

  populateXpos(entry) {
    if (entry.async || this._ag === -1) { // new agroup
      this.agroups.push({
        size: 0,
        width: 1,
        start: entry.ts,
        initiator: entry,
      })
      this._ag = this.agroups.length - 1
      this._xpos = 0
      this._last = null
    }

    entry.xpos = this._xpos
    entry.agroup = this._ag
    this.agroups[this._ag].size += 1

    if (this._last) {
      if ((this._last.sid === entry.sid && !(this._last.type === 'recv' && entry.type === 'send')) ||
          (this._last.sid > entry.sid)) { //  && this._last.type === 'send' && this._last.uid !== entry.uid)) {
        entry.xpos += 1
        this._xpos += 1
        this.agroups[this._ag].width = this._xpos + 1
      }
    }

    this._last = entry
  }

  getSid() {
    return this._sid++
  }

  getUid() {
    return this._uid++
  }

  addStream(stream) {
    let sid = this.getSid()
    stream.id = sid
    stream.values = []
    stream.insync = setTimeout(() => stream.insync = null, 0)
    // debug stream creation console.log('created stream', stream)
    this.streams[sid] = stream
    this.config.onStream(stream)
    return sid
  }

  trace(sid, type, value) {
    let wrapped = type === 'recv' || type === 'pass-wrapped'
    let stream = this.streams[sid]

    if (wrapped && (!value || !value.uid)) {
      console.warn('bad value received...', sid, stream, value)
      return value
    }
    let uid = wrapped ? value.uid : this.getUid()
    let entry = {
      value: wrapped ? value.value : value,
      async: type === 'send' && stream.insync === null,
      ts: Date.now(),
      sid,
      type,
      uid,
    }

    this.populateXpos(entry)

    stream.values.push(entry)
    this.config.onValue(entry, sid)
    if (type === 'send') { // data is leaving this stream
      // debug wrap / unwrap console.log('wrapping', value, uid, sid, stream)
      value = {value, uid}
    } else if (type === 'recv') { // data is entering this stream
      value = value.value
      // debug wrap / unwrap console.log('unwrapping', value, uid, sid, stream)
      if (stream.insync === null) {
        stream.insync = setTimeout(() => stream.insync = null, 0)
      }
    }
    return value
  }

  traceMap(sid, type) {
    if (['send', 'recv', 'pass', 'pass-wrapped'].indexOf(type) === -1) {
      throw new Error('invalid map type: ' + type)
    }
    let trace = this.trace.bind(this, sid, type)
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
  }

  dump() {
    let streams = {}
    let cleanValue = value => {
      let clean = assign({}, value)
      clean.value = utils.asString(value.value).slice(0, 100)
      return clean
    }
    for (let sid in this.streams) {
      let stream = this.streams[sid]
      streams[sid] = assign({}, stream)
      streams[sid].values = stream.values.map(cleanValue)
      streams[sid].meta = utils.asString(streams[sid].meta).slice(0, 100)
    }
    let groups = this.agroups.map(group => {
      group = assign({}, group)
      group.initiator = assign({}, group.initiator, {
        value: utils.asString(group.initiator.value).slice(0, 100)
      })
      return group
    })
    return {streams, groups}
  }
}


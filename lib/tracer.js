'use strict'

import assign from 'object-assign'
import utils from './utils'

export default class Tracer {
  constructor(config) {
    this.config = assign({
      filterFiles: [],
      onValue: function(){},
      onStream: function(){},
      onDeactivate: function(){},
    }, config)
    this.reset()
  }

  reset() {
    this.streams = {}
    this.actives = new Set()
    this.insync = false
    // this.sids = {}
    // this.positions = []

    this.running = true

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
    if (!this.insync) {
      entry.async = true
      this.insync = setTimeout(_ => this.insync = false, 0)
    }
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

    if (!this._last) return this._last = entry

    let {sid: lsid, type: ltype} = this._last
    if (
      // same line, handoff
      (entry.sid === lsid && ltype === 'recv' && entry.type === 'send') ||
      // later line, no interference
      (entry.sid > lsid &&/*entry.sid > lsid && */ltype !== entry.type)
    ) {
      // pass
    } else {
      entry.xpos += 1
      this._xpos += 1
      this.agroups[this._ag].width = this._xpos + 1
    }

    this._last = entry
  }

  getSid() {
    return this._sid++
  }

  getUid() {
    return this._uid++
  }

  addStream(stream, atPos) {
    let sid = this.getSid()
    stream.id = sid
    if (!stream.active) stream.active = false
    stream.values = []
    // debug stream creation console.log('created stream', stream)
    this.streams[sid] = stream
    // this.config.onStream(stream)
    if (atPos) {
      // this.positions
    }
    return sid
  }

  setStreamName(sid, name) {
    this.streams[sid].title = name
  }

  setActive(sid, value) {
    this.streams[sid].active = value
    if (value) {
      this.actives.add(sid)
      if (this.actives.size === 1) {
        // emit "activate"
      }
    } else {
      this.actives.delete(sid)
      if (this.actives.size === 0) {
        this.config.onDeactivate()
        // emit "deactivate"
      }
    }
  }

  trace(sid, type, em, value, etype) {
    if (!this.running) return
    let wrapped = type === 'recv' || type === 'pass-wrapped'
    let stream = this.streams[sid]
    if (etype === 'end') wrapped = false

    if (wrapped && (!value || !value.uid)) {
      console.warn('bad value received...', sid, stream, value)
      return value
    }
    let uid = wrapped ? value.uid : this.getUid()
    let entry = {
      value: wrapped ? value.value : value,
      ts: Date.now(),
      active: stream.active,
      // active: em ? em._active : true,
      // alive: em ? em._alive : true,
      sid,
      type,
      uid,
    }

    this.populateXpos(entry)

    if (type === 'active') {
      this.setActive(sid, value)
    }

    stream.values.push(entry)
    this.config.onValue(entry, sid)
    if (etype === 'end') return
    if (type === 'send') { // data is leaving this stream
      // debug wrap / unwrap console.log('wrapping', value, uid, sid, stream)
      value = {value, uid}
    } else if (type === 'recv') { // data is entering this stream
      value = value.value
      // debug wrap / unwrap console.log('unwrapping', value, uid, sid, stream)
    }
    return value
  }

  traceMap(sid, type, em) {
    if (['send', 'recv', 'pass', 'pass-wrapped'].indexOf(type) === -1) {
      throw new Error('invalid map type: ' + type)
    }
    let trace = this.trace.bind(this, sid, type, em)
    return trace
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


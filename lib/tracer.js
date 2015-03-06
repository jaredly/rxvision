'use strict'

import assign from 'object-assign'
import utils from './utils'

export default class Tracer {
  constructor(config) {
    this.config = assign({
      filterFiles: [],
    }, config)
    this.streams = {}

    this._sid = 10
    this._uid = 1000
  }

  getStack() {
    let filterFiles = this.config.filterFiles
    try {throw new Error()}
    catch (e) {
      // first two lines are right here, and the caller (from rx-tracer.js)
      return e.stack.split('\n').slice(2)
        .filter(line => !filterFiles.some(file => file.indexOf(line) !== -1))
        .join('\n')
    }
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
    this.streams[sid] = stream
    return sid
  }

  traceMap(sid, type) {
    if (type !== 'send' && type !== 'recv' && type !==' pass') {
      throw new Error('invalid map type')
    }
    let unwrap = type === 'recv'
    let stream = this.streams[sid]
    let getUid = this.getUid.bind(this)
    let clearsync = () => stream.insync = null
    return function (value) {
      let uid = unwrap ? value.uid : getUid()
      stream.values.push({
        value: unwrap ? value.value : value,
        async: type === 'send' && stream.insync === null,
        ts: Date.now(),
        type,
        uid,
      })
      if (type === 'send') { // data is leaving this stream
        value = {value, uid}
      } else if (type === 'recv') { // data is entering this stream
        value = value.value
        if (stream.insync === null) {
          stream.insync = setTimeout(clearsync, 0)
        }
      }
      return value
    }
  }

  dump() {
    let data = {}
    let cleanValue = value => {
      let clean = assign({}, value)
      clean.value = utils.safeString(value.value).slice(0, 100)
      return clean
    }
    for (let sid in this.streams) {
      let stream = this.streams[sid]
      data[sid] = assign({}, stream)
      data[sid].values = stream.values.map(cleanValue)
    }
    return data
  }
}


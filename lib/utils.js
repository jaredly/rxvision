'use strict'

export default {
  decorate(obj, attr, decorator) {
    obj[attr] = decorator(obj[attr])
  },
  asString(value) {
    try {return JSON.stringify(value) + ''}
    catch(e){}
    try {return value+''}
    catch(e){}
    return 'value cannot be previewed'
  }
}


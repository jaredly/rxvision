
import {ACTIVE, DEACTIVE} from '../consts'

import oneSource from './one-source.json'
import twoSources from './two-sources.json'
import multSources from './multiple-sources.json'
import create from './create.json'

let sources = [oneSource, twoSources, multSources, create]

let cases = sources.map(examples => Object.keys(examples).map(name => {
  let multi = examples[name].length > 1
  return examples[name].map((ex, i) => ({
    title: name + (multi ? '[' + i + ']' : ''),
    it: new Function('Kefir', ex.code),
    code: ex.code,
    events: ex.events,
  }))
})).reduce((ful, one) => ful.concat.apply(ful, one), [])

cases.push({
  title: 'mergeFn',
  it(Kefir) {

    var a = Kefir.sequentially(100, [0, 1, 2]);
    var b = Kefir.sequentially(100, [0, 1, 2]).delay(30);
    var ab = a.merge(b);
    ab.log();
  },
})

cases.push({
  title: 'flatMapFn',
  it(Kefir) {

    var source = Kefir.sequentially(100, [1, 2, 3]);
    var obss = source.map(x => Kefir.interval(40, x).take(4))
    obss.flatMap().log()
  }
})

cases.push({
  title: 'sampledByFn',
  it(Kefir) {

    var a = Kefir.sequentially(200, [2, 3]).toProperty(1);
    var b = Kefir.interval(100, 0).delay(40).take(5);
    var result = a.sampledBy(b, (a, b) => [a,b]);
    result.log();
  },
})

cases.push({
  title: 'Kefir.sampledBy',
  it(Kefir) {

    var a = Kefir.sequentially(200, [2, 3]).toProperty(1);
    var b = Kefir.interval(100, 0).delay(40).take(5);
    var result = Kefir.sampledBy([a], [b], (a, b) => [a,b]);
    result.log();
  },
})


cases.push({
  title: 'combineNoFn',
  it(Kefir) {

    var a = Kefir.sequentially(100, [1, 3]);
    var b = Kefir.sequentially(100, [2, 4]).delay(40);

    Kefir.combine([a, b]).log()
  },
})


cases.push({
  title: 'combineFromObs',
  it(Kefir) {

    var a = Kefir.sequentially(100, [1, 3]);
    var b = Kefir.sequentially(100, [2, 4]).delay(40);

    a.combine(b).log()
  },
  logs: [[1,2],[3,2],[3,4]].map(v => ({type: 'value', value: v})).concat([{type: 'end', value: null}]),
})


cases.push({
  title: 'combineFromObsWithFn',
  it(Kefir) {

    var a = Kefir.sequentially(100, [1, 3]);
    var b = Kefir.sequentially(100, [2, 4]).delay(40);

    a.combine(b, (a, b) => a + b).log()
  },
  logs: [3,5,7].map(v => ({type: 'value', value: v})).concat([{type: 'end', value: null}]),
})

export default cases


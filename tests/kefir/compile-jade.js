
import {Parser} from 'jade'
import fs from 'fs'

convert('one-source')
convert('two-sources')
convert('multiple-sources')
convert('create')

function convert(name) {
  let examples = process('./' + name + '.jade')
  fs.writeFileSync('./' + name + '.json', JSON.stringify(examples, null, 2))
}

function totext(node) {
  if (node.block) return node.block.nodes.map(totext).join('\n')
  return node.val
}

export default function process(fname) {
  let source = fs.readFileSync(fname).toString('utf8')
  let tokens = new Parser(source).parse()

  return tokens.nodes.reduce((state, block) => {
    if (block.name === 'descr-method') {
      state.method = block.args.split(/',\s+'/g)[1].trim("'")
      state.examples[state.method] = []
    }
    if (block.name !== 'pre') return state
    let title = block.attrs[0].val
    let text = totext(block)
    if (title === "'example'") {
      state.examples[state.method].push({code: text})
      return state
    }
    let ex = state.examples[state.method]
    ex = ex[ex.length - 1]
    if (title === "'console output'") {
      ex.console = text
    } else if (title === "'events in time'") {
      ex.events = text
    }
    return state
  }, {
    examples: {}
  }).examples
}


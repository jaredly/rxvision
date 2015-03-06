'use strict'

export default class Tip {
  constructor(node) {
    this.node = d3.select(node).append('div').attr('class', 'tip')
  }

  hide() {
    this.node.style('opacity', '0')
  }

  show(x, y, text) {
    this.node.style('top', y + 'px')
      .style('left', x + 'px')
      .style('opacity', '1')
      .text(text)
  }
}


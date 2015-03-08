#!/usr/bin/env python

open('index.html', 'w').write(
    open('tpl.html').read()
        .replace('{CODE}', open('index.js').read()))

# vim: et sw=4 sts=4

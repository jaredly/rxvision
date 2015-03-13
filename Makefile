

build: builddir build/react.js rx viz

builddir:
	mkdir -p build

build/react.js:
	browserify -r react -r react/addons -o build/react.js

rx:
	browserify -d -t babelify run/rx.js -o build/rxvision.js

rx-watch:
	watchify -v -d -t babelify run/rx.js -o build/rxvision.js

viz:
	browserify -d -t babelify run/viz.js -o build/viz.js

viz-watch:
	watchify -v -d -t babelify run/viz.js -o build/viz.js



MODS=' react react/addons less babel \
codemirror \
codemirror/mode/javascript/javascript \
codemirror/mode/css/css \
codemirror/mode/htmlmixed/htmlmixed \
codemirror/addon/edit/closebrackets \
codemirror/addon/edit/matchbrackets'

INC=`echo ${MODS} | sed -e 's/ / -r /g'` 
EXC=`echo ${MODS} | sed -e 's/ / -x /g'` 

playground:
	browserify ${EXC} -d -t babelify run/playground.js -o build/playground.js

playground-css:
	lessc run/playground.less examples/playground/index.css

playground-watch:
	watchify -v ${EXC} -d -t babelify run/playground.js -o build/playground.js

lib-playground:
	browserify ${INC} -o build/lib-playground.js

lint:
	eslint run wrap lib

.PHONY: js watch build playground lib-playground

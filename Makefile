
build: build/react.js js

build/react.js:
	browserify -r react -r react/addons -o build/react.js

js:
	browserify -x react -x react/addons -d -t babelify run.js -o build/run.js

watch:
	watchify -v -x react -x react/addons -d -t babelify run.js -o build/run.js

rx:
	browserify -d -t babelify run/rx.js -o build/rxvision.js

rx-watch:
	watchify -v -d -t babelify run/rx.js -o build/rxvision.js

viz:
	browserify -x react -x react/addons -d -t babelify run/viz.js -o build/viz.js

viz-watch:
	watchify -v -x react -x react/addons -d -t babelify run/viz.js -o build/viz.js

lib-viz:
	browserify -r react -r react/addons -o build/viz-lib.js

lint:
	eslint run wrap lib

.PHONY: js watch build

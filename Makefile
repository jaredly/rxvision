
build: build/react.js js

build/react.js:
	browserify -r react -r react/addons -o build/react.js

js:
	browserify -x react -x react/addons -d -t babelify run.js -o build/run.js

watch:
	watchify -v -x react -x react/addons -d -t babelify run.js -o build/run.js

.PHONY: js watch build

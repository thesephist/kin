all: run

# run app server
run:
	ink src/main.ink

# build dependencies
build-libs:
	september translate \
		lib/stub.ink \
		vendor/std.ink \
		vendor/str.ink \
		vendor/quicksort.ink \
		| tee /dev/stderr > static/ink/lib.js

# build september
build-september:
	september translate \
		../september/src/iota.ink \
		../september/src/tokenize.ink \
		| tee /dev/stderr > static/ink/september.js

# build app clients
build:
	cat static/js/ink.js \
		static/js/torus.min.js \
		static/js/highlight.js \
		> static/ink/vendor.js
	september translate \
		lib/torus.js.ink \
		src/highlight.ink \
		src/app.js.ink \
		| tee /dev/stderr > static/ink/common.js
	cat \
		static/ink/vendor.js \
		static/ink/lib.js \
		static/ink/september.js \
		static/ink/common.js \
		> static/ink/bundle.js
b: build

# run all builds from scratch
build-all: build-libs build-september build

# build whenever Ink sources change
watch:
	ls lib/* src/* | entr make build
w: watch

# run all tests under test/
check:
	ink ./test/main.ink
t: check

fmt:
	inkfmt fix lib/*.ink src/*.ink test/*.ink
f: fmt


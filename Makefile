all: run

# run app server
run:
	ink src/main.ink

# build app clients
build:
	cat static/js/ink.js \
		static/js/torus.min.js \
		> static/ink/vendor.js
	september translate \
		lib/stub.ink \
		vendor/std.ink \
		vendor/str.ink \
		vendor/quicksort.ink \
		vendor/json.ink \
		lib/torus.js.ink \
		src/app.js.ink \
		| tee /dev/stderr > static/ink/common.js
	cat \
		static/ink/vendor.js \
		static/ink/common.js \
		> static/ink/bundle.js
b: build

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


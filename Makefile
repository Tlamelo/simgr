BIN = ./node_modules/.bin/

test:
	@${BIN}mocha \
		--require should \
		--reporter spec \
		--timeout 1200000 \
		test/setup.js \
		test/jpeg.js \
		test/png.js \
		test/tiff.js \
		test/gif-single-frame.js \
		test/cmyk.js \
		test/grayscale.js \
		test/text.js \
		test/webp.js \
		test/gif.js \
		test/large.js

clean:
	@rm -rf node_modules

lint:
	@${BIN}jshint .

.PHONY: test clean lint
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 1200000 \
		--bail

clean:
	@rm -rf node_modules

lint:
	@${BIN}jshint .

.PHONY: test clean lint
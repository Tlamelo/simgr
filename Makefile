test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 1200000

.PHONY: test
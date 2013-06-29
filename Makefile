test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 30000

.PHONY: test
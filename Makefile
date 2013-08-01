test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 1200000 \
		--bail

clean:
	@rm -rf node_modules

.PHONY: test clean
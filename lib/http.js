const STATUS_CODES = require('http').STATUS_CODES

var Simgr = require('./Simgr')

// Returns error or null
// Check a HTTP request to the simgr,
// or check a response from an HTTP request.
// Since clients and servers can lie,
// this is not a reliable place for security checks.
Simgr.prototype.checkHTTPHeaders = function (res) {
  var contentType = res.headers['content-type']
  if (/^image\/.+/i.test(contentType)) {
    if (contentType !== 'png' && contentType !== 'jpeg')
      throw this.httpError(415, 'Only JPEGs and PNGs are supported.')
  } else {
    throw this.httpError(415, 'File must be an image.')
  }

  var contentLength = parseInt(res.headers['content-length'] || 0, 10)
  if (!contentLength)
    throw this.httpError(411)
  if (contentLength > this.maxsize)
    throw this.httpError(413)
}

Simgr.prototype.httpError = function (status, message) {
  status = status || 500
  var err = new Error(message || STATUS_CODES[status])
  err.status = status
  return err
}
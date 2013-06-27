const STATUS_CODES = require('http').STATUS_CODES

var Service = require('./Service')

// Returns error or null
// Check a HTTP request to the service,
// or check a response from an HTTP request.
// Since clients and servers can lie,
// this is not a reliable place for security checks.
Service.prototype.checkHTTPHeaders = function (res) {
  var contentType = res.headers['content-type']
  if (/^image\/.+/i.test(contentType)) {
    if (contentType !== 'png' && contentType !== 'jpeg')
      return this.httpError(415, 'Only JPEGs and PNGs are supported.')
  } else {
    return this.httpError(415, 'File must be an image.')
  }

  var contentLength = parseInt(res.headers['content-length'] || 0, 10)
  if (!contentLength)
    return this.httpError(411)
  if (contentLength > this.maxsize)
    return this.httpError(413)
}

Service.prototype.httpError = function (status, message) {
  status = status || 500
  var err = new Error(message || STATUS_CODES[status])
  err.status = status
  return err
}
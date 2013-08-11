const STATUS_CODES = require('http').STATUS_CODES

var Simgr = require('./Simgr')

var isImageType = /^image\/.+/i

// Since clients and servers can lie,
// this is not a reliable place for security checks.
Simgr.prototype.checkHTTPHeaders = function (res, allowChunked) {
  var headers = res.headers

  var contentType = headers['content-type']
  if (isImageType.test(contentType)) {
    if (!this.supportedInputFormat(contentType))
      throw this.error('unsupportedInputFormat')
  } else {
    throw this.error('notAnImage')
  }

  // Better not to support chunked encoding whenever possible,
  // but some servers suck and use chunked encoding on images.
  // You should limit the request body yourself.
  var chunked = headers['transfer-encoding'] === 'chunked'
  if (chunked) {
    if (allowChunked)
      return
    else
      throw this.error('chunkedEncodingNotAllowed')
  }

  // If no chunked encoding, a content-length is required.
  var contentLength = parseInt(headers['content-length'] || 0, 10)
  if (!contentLength)
    throw this.error('contentLengthRequired')
  if (contentLength > this.maxsize)
    throw this.error('imageSizeTooLarge')
}
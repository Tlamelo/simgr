var knox = require('knox')

var Simgr = require('./Simgr')

Simgr.prototype.setS3Client = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.S3Client = knox.createClient(options)
}

Simgr.prototype.setCacheClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.cacheClient = knox.createClient(options)
}

Simgr.prototype.checkS3Client = function () {
  if (!(this.S3Client))
    throw new Error('AWS client required!')
}

Simgr.prototype.checkCacheClient = function () {
  if (!(this.cacheClient))
    throw new Error('AWS cache client required!')
}

Simgr.prototype.getFromS3 = function (name, callback) {
  var that = this

  this.checkS3Client()

  this.S3Client.getFile(name, function (err, res) {
    if (err)
      return callback(err)

    if (res.statusCode !== 200) {
      callback(that.error('imageNotFound'))
      res.resume()
      return
    }

    callback(null, res)
  })
}

Simgr.prototype.getFromCache = function (name, callback) {
  this.checkCacheClient()

  this.cacheClient.getFile(name, callback)
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  this.checkS3Client()

  var name = metadata.name
  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}

  headers['Content-Type'] = this.mimeTypes[metadata.format]

  this.S3Client.putFile(path, name, headers, dumpResponse(callback))
}

Simgr.prototype.cacheVariant = function (options, callback) {
  this.checkS3Client()

  var name = options.name
  var path = options.path
  var headers = options.headers = options.headers || {}

  headers['Content-Type'] = this.mimeTypes[options.format]
  headers['Last-Modified'] = new Date()
  headers['x-amz-storage-class'] = 'REDUCED_REDUNDANCY'

  this.cacheClient.putFile(path, name, headers, dumpResponse(callback))
}

// We only care about the status code response
// when PUTing files to S3.
function dumpResponse(callback) {
  return function (err, res) {
    res && res.resume()
    callback(err, res)
  }
}
var knox = require('knox')

var Simgr = require('./Simgr')

Simgr.prototype.setS3Client = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.S3Client = knox.createClient(options)

  return this
}

Simgr.prototype.setCacheClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.cacheClient = knox.createClient(options)

  return this
}

Simgr.prototype.checkS3Client = function () {
  if (!(this.S3Client))
    throw new Error('AWS client required!')

  return this
}

Simgr.prototype.checkCacheClient = function () {
  if (!(this.cacheClient))
    throw new Error('AWS cache client required!')

  return this
}

// input = S3 filename
// output = temporary local filename
Simgr.prototype.getFromS3 = function (name, callback) {
  var that = this

  this.checkS3Client()

  this.S3Client.getFile(name, function (err, res) {
    if (err)
      callback(err)
    else if (res.statusCode !== 200)
      callback(that.error('imageNotFound'))
    else
      that.saveFile(res, callback)
  })

  return this
}

Simgr.prototype.getFromCache = function (name, callback) {
  this.checkCacheClient()

  this.cacheClient.getFile(name, callback)

  return this
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  this.checkS3Client()

  var name = metadata.name
  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}

  headers['Content-Type'] = this.mimeTypes[metadata.format]

  this.S3Client.putFile(path, name, headers, dumpResponse(callback))

  return this
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

  return this
}

// We only care about the status code response
// when PUTing files to S3.
function dumpResponse(callback) {
  return function (err, res) {
    res && res.resume()
    callback(err, res)
  }
}
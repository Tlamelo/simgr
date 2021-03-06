var knox = require('knox')

var Simgr = require('./Simgr')

Simgr.prototype.setStoreClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.StoreClient = knox.createClient(options)
}

Simgr.prototype.setCacheClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.cacheClient = knox.createClient(options)
}

Simgr.prototype.checkStoreClient = function () {
  if (!(this.StoreClient))
    throw new Error('AWS client required!')
}

Simgr.prototype.checkCacheClient = function () {
  if (!(this.cacheClient))
    throw new Error('AWS cache client required!')
}

Simgr.prototype.getFromStore = function (name, callback) {
  var that = this

  this.checkStoreClient()

  this.StoreClient.getFile(name, function (err, res) {
    if (err || res.statusCode !== 200) {
      callback(err || that.error('image-source-not-found'))
      res.resume()
    } else {
      callback(null, res)
    }
  })
}

Simgr.prototype.getFromCache = function (name, callback) {
  this.checkCacheClient()

  this.cacheClient.getFile(name, function (err, res) {
    if (err)
      callback(err)
    else if (res.statusCode === 200)
      callback(null, res)
    else
      callback()
  })
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  this.checkStoreClient()

  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = this.mimeTypes[metadata.format]

  this.StoreClient.putFile(metadata.path, metadata.name, headers, dumpResponse(callback))
}

Simgr.prototype.cacheVariant = function (path, name, format, callback) {
  this.checkStoreClient()

  var headers = {}

  // Knox will set the content-length
  // S3 will set the ETag
  // You should set expire time on the bucket
  headers['Content-Type'] = this.mimeTypes[format]
  headers['Last-Modified'] = new Date()
  // You don't care if you lose these
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
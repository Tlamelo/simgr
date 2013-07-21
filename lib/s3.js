var knox = require('knox')

var Simgr = require('./Simgr')

Simgr.prototype.setS3Client = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.S3Client = knox.createClient(options)

  return this
}

// Make sure the S3Client is set
Simgr.prototype.checkS3Client = function () {
  if (!(this.S3Client))
    throw new Error('AWS client required!')

  return this
}

Simgr.prototype.setCacheClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.cacheClient = knox.createClient(options)

  return this
}

// input = S3 filename
// output = temporary local filename
Simgr.prototype.getFromS3 = function (name, callback) {
  var that = this

  this.checkS3Client()

  this.S3Client.getFile(name, function (err, res) {
    if (err)
      return callback(err)

    var statusCode = res.statusCode
    if (statusCode !== 200)
      return callback(that.error('imageNotFound'))

    that.saveFile(res, callback)
  })

  return this
}

Simgr.prototype.getFromCache = function (name, callback) {
  var that = this

  // If no cache client enabled, ignore.
  if (!this.cacheClient)
    return callback()

  this.cacheClient.getFile(name, function (err, res) {
    if (err || res.statusCode !== 200)
      return callback(err)

    that.saveFile(res, callback)
  })
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  this.checkS3Client()

  var name = metadata.name
  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = this.mimeTypes[metadata.format]

  this.S3Client.putFile(path, name, headers, callback)

  return this
}

Simgr.prototype.cacheImage = function (metadata, callback) {
  if (!this.cacheClient)
    return callback()

  var name = metadata.name
  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = this.mimeTypes[metadata.format]
  headers['x-amz-storage-class'] = 'REDUCED_REDUNDANCY'

  this.cacheClient.putFile(path, name, headers, callback)

  return this
}
var knox = require('knox')

var Simgr = require('./Simgr')

Simgr.prototype.setAWSClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.awsClient = knox.createClient(options)

  return this
}

// Make sure the awsClient is set
Simgr.prototype.checkAWSClient = function () {
  if (!(this.awsClient))
    throw new Error('AWS client required!')

  return this
}

// input = S3 filename
// output = temporary local filename
Simgr.prototype.getFromS3 = function (name, callback) {
  var that = this

  this.checkAWSClient()

  this.awsClient.getFile(name, function (err, res) {
    if (err)
      return callback(err)

    var statusCode = res.statusCode
    if (statusCode !== 200)
      return callback(that.error('imageNotFound'))

    that.saveFile(res, callback)
  })

  return this
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  this.checkAWSClient()

  var name = metadata.name
  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = this.mimeTypes[metadata.format]

  this.awsClient.putFile(path, name, headers, callback)

  return this
}
var parallel = require('array-parallel')

var Simgr = require('./Simgr')

Simgr.prototype.validateImage = function (metadata, callback) {
  if (typeof metadata === 'string')
    metadata = {
      path: metadata
    }

  var that = this
  var filename = metadata.path

  parallel([
    checkFilesize,
    checkDimensions,
    checkFormat
  ], this, callback)

  function checkFilesize(done) {
    this.getFilesize(filename, function (err, length) {
      if (err)
        return done(err)

      if (length > that.maxsize)
        return done(that.error('imageSizeTooLarge'))

      done()
    })
  }

  function checkDimensions(done) {
    this.getDimensions(filename, function (err, size) {
      if (err)
        return done(err)

      if (size.width * size.height > that.maxarea)
        return done(that.error('imageAreaTooLarge'))

      done()
    })
  }

  function checkFormat(done) {
    this.getFormat(filename, function (err, format) {
      if (err)
        return done(err)

      if (!(metadata.format = that.supportedInputFormat(format)))
        return done(that.error('unsupportedInputFormat'))

      done()
    })
  }

  return this
}

Simgr.prototype.identifyImage = function (metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  if (typeof metadata === 'string')
    metadata = {
      path: metadata
    }

  this.gm(metadata.path).identify(function (err, identity) {
    if (err)
      return callback(err)

    metadata.identity = identity
    callback(null, metadata)
  })

  return this
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  this.checkAWSClient()

  var name = metadata.name
  if (!name)
    throw new Error('You must define an image name!')

  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = this.mimeTypes[metadata.format]

  this.awsClient.putFile(path, name, headers, callback)

  return this
}
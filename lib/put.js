var mime = require('mime')
var parallel = require('array-parallel')
var debug = require('debug')('simgr')

var Simgr = require('./Simgr')

// Public
Simgr.prototype.identifyImage = function (stream, metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  var that = this

  parallel([
    saveFile,
    checkImageFormat,
    checkImageSize
  ], this, identify)

  function saveFile(done) {
    this.saveFile(stream, function (err, path) {
      if (err)
        return done(err)

      metadata.path = path
      debug('saved an image to ' + path)
      done()
    })
  }

  function checkImageFormat(done) {
    this.gm(stream).format(function (err, format) {
      if (err)
        return done(err)

      if (!(metadata.format = that.supportedInputFormat(format)))
        return done(that.error('unsupportedInputFormat'))

      done()
    })
  }

  function checkImageSize(done) {
    this.gm(stream).size(function (err, size) {
      if (err)
        return done(err)

      if (size.width * size.height > that.maxarea)
        return done(that.error('imageAreaTooLarge'))

      done()
    })
  }

  function identify(err) {
    if (err)
      return callback.call(that, err)

    that.identify(metadata.path, function (err, identity) {
      if (err)
        return callback.call(that, err)

      metadata.identity = identity
      debug('identified ' + metadata.path)

      callback.call(that)
    })
  }

  return this
}

// Public
Simgr.prototype.uploadImage = function (metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  var that = this

  this.checkAWSClient()

  var name = metadata.name
  if (!name)
    throw new Error('You must define an image name!')

  var path = metadata.path
  var headers =
  metadata.headers = metadata.headers || {}
  headers['Content-Type'] = mime.lookup(metadata.identity.format)

  debug('uploading ' + path + ' as ' + name)

  this.awsClient.putFile(path, name, headers, function (err) {
    err
      ? debug('upload failed: ' + path + ' as ' + name)
      : debug('uploaded ' + path + ' as ' + name)

    callback(err)
    process.nextTick(that.deleteFile.bind(that, path))
  })

  return this
}
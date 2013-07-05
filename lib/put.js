var mime = require('mime')
var parallel = require('array-parallel')
var debug = require('debug')('simgr')

var Simgr = require('./Simgr')

// Public
Simgr.prototype.identifyImage = function (stream, metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  parallel([saveFile, identifyImage], this, callback)

  function saveFile(done) {
    this.saveFile(stream, function (err, path) {
      if (err)
        return done(err)

      metadata.path = path
      debug('saved an image to ' + path)
      done()
    })
  }

  function identifyImage(done) {
    this.identify(stream, function (err, identity) {
      if (err)
        return done(err)

      metadata.identity = identity
      debug('identified ' + (metadata.path || 'an image'))

      var size = identity.size
      if (size.width * size.height > this.maxarea)
        return done(this.error('imageAreaTooLarge'))

      if (!(metadata.format = this.supportedInputFormat(identity.format)))
        return done(this.error('unsupportedInputFormat'))

      done()
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
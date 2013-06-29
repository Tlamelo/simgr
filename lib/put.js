var mime = require('mime')
var debug = require('debug')('simgr')

var Simgr = require('./Simgr')

Simgr.prototype.identifyImage = function (stream, metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  this.saveFile(stream, function (err, path) {
    if (err)
      return callback.call(this, err)

    metadata.path = path
    debug('saved an image to ' + path)

    this.stat(path, function (err, stats) {
      if (err)
        return callback.call(this, err)

      metadata.stats = stats
      debug('stat ' + path)

      if (stats.size > this.maxsize)
        return callback.call(this, this.error('imageSizeTooLarge'))

      this.identify(path, function (err, identity) {
        if (err)
          return callback.call(this, err)

        metadata.identity = identity
        debug('identified ' + path)

        var size = identity.size
        if (size.width * size.height > this.maxarea)
          return callback.call(this, this.error('imageAreaTooLarge'))

        if (!this.supportedInputFormat(identity.format))
          return callback.call(this, this.error('unsupportedInputFormat'))

        this.emit('identify', metadata)
        callback.call(this)
      })
    })
  })

  return this
}

Simgr.prototype.uploadImage = function (metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  var that = this

  this.checkAWSClient()

  var name = metadata.name
  if (!name)
    throw new Error('You must define an image name!')

  var path = metadata.path
  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = mime.lookup(metadata.identity.format)

  debug('uploading ' + path + ' as ' + name)

  this.awsClient.putFile(path, name, headers, function (err) {
    if (err)
      return callback.call(that, err)

    debug('uploaded ' + path + ' as ' + name)
    that.emit('upload', metadata)
    callback.call(that, null, metadata)
  })

  return this
}
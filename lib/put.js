var mime = require('mime')
var debug = require('debug')('irp')

var Service = require('./Service')

Service.prototype.identifyImage = function (stream, metadata, _callback) {
  var that = this

  metadata = metadata || {}

  this.saveFile(stream, function (err, path) {
    if (err)
      return callback(err)

    metadata.path = path

    debug('saved an image to ' + path)

    this.stat(path, function (err, stats) {
      if (err)
        return callback(err)

      metadata.stats = stats
      debug('stat ' + path)

      if (stats.size > this.maxsize)
        return callback(this.errors('imageSizeTooLarge'))

      this.identify(path, function (err, identity) {
        if (err)
          return callback(err)

        metadata.identity = identity
        debug('identified ' + path)

        var size = identity.size
        if (size.width * size.height > this.maxarea)
          return callback(this.errors('imageAreaTooLarge'))
        if (!this.supportedInputFormat(identity.format))
          return callback(this.errors('unsupportedInputFormat'))

        that.emit('identify', metadata)
        callback(null, metadata)
      })
    })
  })

  function callback(err) {
    if (err)
      that.deleteFile(metadata.path)

    _callback.call(that, err, metadata)
  }

  return this
}

Service.prototype.uploadImage = function (metadata, callback) {
  callback = callback.bind(this)
  var that = this

  var filename = metadata.filename = metadata.filename || this.getName(metadata)
  var headers = metadata.headers = metadata.headers || {}
  headers['Content-Type'] = mime.lookup(name)

  debug('uploading ' + metadata.path + ' as ' + metadata.name)

  this.awsClient.putFile(metadata.path, filename, headers, function (err) {
    if (err)
      return callback(err)

    debug('uploaded ' + metadata.path + ' as ' + metadata.name)
    that.emit('upload', metadata)
    callback(null, metadata)
  })

  return this
}
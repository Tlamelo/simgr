var Through = require('through')
var debug = require('debug')('simgr')

var Simgr = require('./Simgr')

Simgr.prototype.getVariant = function (metadata, options) {
  if (!metadata)
    throw new Error('Metadata required.')

  options = options || {}

  var through = Through()

  try {
    this.checkVariant(metadata, options)
  } catch (err) {
    process.nextTick(through.emit.bind(through, 'error', err))
    return through
  }

  this.getImageFromS3(metadata, function (err, stream) {
    if (err)
      return through.emit('error', err)

    this.resizeImage(stream, through, metadata, options)
  })

  return through
}

// Private
Simgr.prototype.checkVariant = function (metadata, options) {
  var slug = options.slug = options.slug || metadata.slug || 'o'
  var variant = options.variant = this.variant[slug]
  if (!variant)
    throw this.error('undefinedVariant')

  var format = options.format = this.supportedOutputFormat(options.format
    || metadata.identity.format
    || 'jpg'
  )
  if (!format)
    throw this.error('unsupportedOutputFormat')

  return variant
}

// Private
Simgr.prototype.resizeImage = function (readStream, writeStream, metadata, options) {
  var format = options.format
  var variant = options.variant

  var proc = this.gm(readStream)
  .interlace('Plane')
  .autoOrient()
  .setFormat(format)

  var size = variant.size
  if (size)
    proc.resize(size.width, size.height, size.option)

  if (format === 'jpg') {
    var identity = metadata.identity
    var currentquality = parseInt(identity.Quality || identity['JPEG-Quality'], 10)
    var quality = variant.quality
    if (!currentquality || currentquality > quality)
      proc.quality(quality)
  }

  proc.stream(function (err, stream) {
    if (err)
      return writeStream.emit('error', err)

    stream.on('error', writeStream.emit.bind(writeStream, 'error'))
    stream.pipe(writeStream)
  })

  return this
}

// Private
Simgr.prototype.getImageFromS3 = function (metadata, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  var that = this

  var name = metadata.name
  if (!name)
    throw new Error('Need a name to get from S3!')

  this.checkAWSClient()

  this.awsClient.getFile(name, function (err, res) {
    if (err)
      return callback.call(that, err)

    var statusCode = res.statusCode

    debug('got statusCode ' + statusCode + ' for file ' + name)

    if (statusCode !== 200)
      return callback.call(that, that.error('imageNotFound'))

    callback.call(that, null, res)
  })

  return this
}
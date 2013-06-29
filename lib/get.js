var debug = require('debug')('simgr')

var Simgr = require('./Simgr')

Simgr.prototype.checkVariant = function (metadata, options) {
  var slug = options.slug = options.slug || metadata.slug || 'o'
  var variant = this.variant[slug]
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

// Returns the location of the image.
Simgr.prototype.resizeImage = function (stream, metadata, options, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  options = options || {}

  var that = this
  var variant

  try {
    variant = this.checkVariant(metadata, options)
  } catch (err) {
    return callback.call(this, err)
  }

  var format = options.format

  var proc = this.gm(stream)
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

  this.createFileName(function (err, location) {
    if (err)
      return callback.call(that, err)

    proc.write(location, function (err) {
      if (err)
        return callback.call(this, err)

      that.emit('resize', metadata, options, location)
      callback.call(that, null, location)
    })
  })

  return this
}

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

Simgr.prototype.getVariant = function (metadata, options, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  options = options || {}

  try {
    this.checkVariant(metadata, options)
  } catch (err) {
    return callback.call(this, err)
  }

  this.getImageFromS3(metadata, function (err, stream) {
    if (err)
      return callback.call(this, err)

    this.resizeImage(stream, metadata, options, callback)
  })

  return this
}
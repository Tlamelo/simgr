var Simgr = require('./Simgr')

Simgr.prototype.checkVariant = function (metadata, options) {
  var slug = options.slug = options.slug || metadata.slug || 'o'
  var variant = this.variant[slug]
  if (!variant)
    throw this.errors('undefinedVariant')

  var identity = metadata.identity
  var format = options.format = this.supportedOutputFormat(options.format
    || metadata.format
    || (identity && identity.format)
    || 'jpg'
  )
  if (!format)
    throw this.errors('unsupportedOutputFormat')

  return variant
}

// Returns the location of the image.
Simgr.prototype.resizeImage = function (stream, metadata, options, callback) {
  metadata = metadata || {}
  options = options || {}

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

  var size = variant.size
  if (size)
    proc.resize(size.width, size.height, size.option)

  if (format === 'jpg') {
    var identity = metadata.identity
    var currentquality = identity &&
      parseInt(identity.Quality || identity['JPEG-Quality'], 10)
    var quality = variant.quality
    if (!currentquality || currentquality > quality)
      proc.quality(quality)
  }

  this.createFileName(format, function (err, location) {
    proc.write(location, function (err) {
      if (err)
        callback.call(this, err)
      else
        callback.call(this, null, location)
    })
  })

  return this
}

Simgr.prototype.getImageFromS3 = function (metadata, callback) {
  var that = this

  this.awsClient.getFile(metadata.filename, function (err, res) {
    if (err)
      return callback.call(that, err)

    if (res.statusCode !== 200)
      return callback.call(that, that.errors('imageNotFound'))

    callback.call(that, null, res)
  })

  return this
}

Simgr.prototype.getVariant = function (metadata, options, callback) {
  metadata = metadata || {}
  options = options || {}

  var variant

  try {
    variant = this.checkVariant(metadata, options)
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
var Service = require('./Service')

Service.prototype.resizeImage = function (stream, metadata, options, callback) {
  options = options || {}

  var that = this
  var identity = metadata && metadata.identity

  var format = this.supportedOutputFormat(options.format
    || (metadata && metadata.format)
    || (identity && identity.format)
    || 'jpg'
  )
  if (!format)
    return callback.call(this, this.errors('unsupportedOutputFormat'))

  var variant = this.variant[options.slug || 'o']
  if (!variant)
    return callback.call(this, this.errors('undefinedVariant'))

  var proc = this.gm(stream)
  .interlace('Plane')
  .autoOrient()

  var size = variant.size
  if (size)
    proc.resize(size.width, size.height, size.option)

  if (format === 'jpg') {
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
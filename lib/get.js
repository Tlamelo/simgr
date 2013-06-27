var Through = require('through')

var Service = require('./Service')

Service.prototype.resizeImage = function (stream, metadata, slug, format) {
  var through = Through()

  format = this.supportedOutputFormat(format.toLowerCase())
  if (!format)
    return process.nextTick(through.emit.bind(through, 'error', this.errors('unsupportedOutputFormat')))

  var variant = this.variant[slug]
  if (!variant)
    return process.nextTick(through.emit.bind(through, 'error', this.errors('undefinedVariant')))

  var proc = this.gm(stream)
  .interlace('Plane')
  .bitdepth(8)
  .in('-auto-orient')
  .strip()

  var size = variant.size
  if (size)
    proc.resize(size.width, size.height, size.option)

  if (format === 'jpg') {
    var currentquality = metadata && this.getQuality(metadata)
    var quality = variant.quality
    if (!currentquality || currentquality > quality)
      proc.quality(quality)
  }

  proc.stream(format, function (err, stream) {
    if (err)
      through.emit('error', err)
    else
      stream.pipe(through)
  })

  return through
}
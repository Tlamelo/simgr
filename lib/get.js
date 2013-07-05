var execFile = require('child_process').execFile
try {
  var cwebp = require('webp').cwebp
} catch (err) {}

var Simgr = require('./Simgr')

Simgr.prototype.getVariant = function (metadata, options, callback) {
  if (!metadata)
    throw new Error('Metadata required.')

  options = options || {}

  var that = this

  try {
    this.checkVariant(metadata, options)
  } catch (err) {
    return callback(err)
  }

  var name = metadata.name
  if (!name)
    throw new Error('S3 filename required.')

  this.getFromS3(name, function (err, filename) {
    if (err)
      return callback(err)

    metadata.path = filename

    if (options.format === 'webp')
      that.resizeWebp(metadata, options, callback)
    else
      that.resizeImagemagick(metadata, options, callback)
  })
}

// Private, throws if error
Simgr.prototype.checkVariant = function (metadata, options) {
  var slug = options.slug = options.slug || metadata.slug
  if (!slug)
    throw new Error('Slug must be defined.')

  var variant =
  options.variant = this.variant[slug]
  if (!variant)
    throw this.error('undefinedVariant')

  var format =
  options.format = this.supportedOutputFormat(options.format
    || metadata.identity.format
    || 'jpg'
  )
  if (!format)
    throw this.error('unsupportedOutputFormat')

  return variant
}

// Private
Simgr.prototype.resizeImagemagick = function (metadata, options, callback) {
  var that = this
  var format = options.format
  var slug = options.slug
  var variant = options.variant
  var filename = metadata.path

  var args = [
    filename,
    '-interlace', 'Plane',
    '-auto-orient',
    '-strip'
  ]

  if (variant.resize)
    args.push('-resize', variant.resize)

  if (format === 'jpg') {
    var currentquality = parseInt(metadata.identity.Quality, 10)
    var quality = variant.quality
    if (!currentquality || currentquality > quality)
      args.push('-quality', quality)
  }

  var output = [filename, slug, format].join('.')

  execFile('convert', args.concat(output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    callback(null, output)
  })

  return this
}

// Private
Simgr.prototype.resizeWebp = function (metadata, options, callback) {
  var that = this
  var filename = metadata.path
  var slug = options.slug
  var variant = options.variant

  var args = [
    '-quiet',
    '-mt',
    '-q', variant.quality,
    '-m', this.compressionmethod
  ]

  if (this.lowmemory)
    args.push('-low_memory')

  var resize = variant.size
  if (resize) {
    // Have to define the dimensions exactly :(
    var size = metadata.identity.size
    if (size.width <= resize.width && size.height <= resize.height) {
      // do nothing
    } else if (size.width / resize.width > size.height / resize.height) {
      args.push('-resize', resize.width, Math.round(size.height / size.width * resize.width))
    } else {
      args.push('-resize', Math.round(size.width / size.height * resize.height), resize.height)
    }
  }

  var output = [filename, slug, 'webp'].join('.')

  execFile(cwebp, args.concat(metadata.path, '-o', output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    callback(null, output)
  })
}
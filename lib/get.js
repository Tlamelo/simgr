var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

try {
  var cwebp = require('webp').cwebp
} catch (err) {}

Simgr.prototype.webp = !!cwebp

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

  this.getFromS3(metadata.name, function (err, filename) {
    if (err)
      return callback(err)

    metadata.path = filename

    if (options.format === 'webp')
      that.resizeWebP(metadata, options, callback)
    else
      that.resizeImagemagick(metadata, options, callback)
  })

  return this
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
    || metadata.format
    || metadata.Format
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

  if (format === 'jpg' &&
    (!metadata.quality || metadata.quality > variant.quality)
  ) args.push('-quality', variant.quality)

  var output = [filename, slug, format].join('.')

  execFile('convert', args.concat(output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, output)
  })

  return this
}

// Private
Simgr.prototype.resizeWebP = function (metadata, options, callback) {
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
  // Have to define the dimensions exactly :(
  if (resize) {
    if (metadata.width <= resize.width && metadata.height <= resize.height) {
      // do nothing
    } else if (metadata.width / resize.width > metadata.height / resize.height) {
      args.push('-resize', resize.width, Math.round(metadata.height / metadata.width * resize.width))
    } else {
      args.push('-resize', Math.round(metadata.width / metadata.height * resize.height), resize.height)
    }
  }

  var output = [filename, slug, 'webp'].join('.')

  execFile(cwebp, args.concat(filename, '-o', output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, output)
  })

  return this
}
var jpegtran = require('jpegtran-bin').path
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

  var name = [metadata.name, options.slug, options.format].join('.')

  this.getFromCache(name, function (err, filename) {
    if (err || filename)
      return callback(err, filename)

    that.getFromS3(metadata.name, function (err, filename) {
      if (err)
        return callback(err)

      metadata.path = filename

      if (options.format === 'webp')
        that.resizeWebP(metadata, options, cacheImage)
      else if (options.format === 'jpg'
        && metadata.Format === 'JPEG'
        && !that.getResizedDimensions(metadata, options.variant.size)
      ) that.optimizeJPEGTran(metadata, options, cacheImage)
      else
        that.resizeImagemagick(metadata, options, cacheImage)

      function cacheImage(err, filename) {
        if (err)
          return callback(err)

        that.cacheImage({
          name: name,
          path: filename,
          format: options.format
        }, noop)

        // We can ignore caching errors
        callback(null, filename)
      }
    })
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

Simgr.prototype.getResizedDimensions = function (metadata, resize) {
  if (!resize)
    return

  // Do nothing if the image is larger than the target size
  if (metadata.width <= resize.width && metadata.height <= resize.height)
    return

  // If width is changing the most, we resize by it.
  if (metadata.width / resize.width > metadata.height / resize.height)
    return [
      resize.width,
      Math.round(metadata.height / metadata.width * resize.width)
    ]

  return [
    Math.round(metadata.width / metadata.height * resize.height),
    resize.height
  ]
}

// Private
Simgr.prototype.resizeImagemagick = function (metadata, options, callback) {
  var that = this
  var format = options.format
  var slug = options.slug
  var variant = options.variant
  var filename = metadata.path
  var colorspace = metadata.colorspace === 'Gray' ? 'Gray' : 'sRGB'

  var args = [
    filename,
    '-interlace', 'Plane',
    '-strip'
  ]

  if (variant.resize) {
    args.push(
      // Convert to a linear colorspace
      '-colorspace', 'RGB',
      '-resize', variant.resize,
      // Convert back to a nonlinear colorspace
      '-colorspace', colorspace,
      // PNG gamma isn't set correctly.
      '-set', 'colorspace', colorspace
    )
  } else {
    // In case we convert an image to grayscale.
    // We only allow sRGB and grayscale
    args.push('-colorspace', colorspace)
  }

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

  var resize = this.getResizedDimensions(metadata, variant.size)
  if (resize)
    args.push('-resize', resize[0], resize[1])

  var output = [filename, slug, 'webp'].join('.')

  execFile(cwebp, args.concat(filename, '-o', output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, output)
  })

  return this
}

Simgr.prototype.optimizeJPEGTran = function (metadata, options, callback) {
  var that = this
  var filename = metadata.path
  var slug = options.slug
  var output = [filename, slug, 'webp'].join('.')

  execFile(jpegtran, [
    '-copy', 'none',
    '-progressive',
    '-optimize',
    '-outfile', output,
    filename
  ], function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, output)
  })
}

function noop() {}
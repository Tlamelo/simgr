var ffmpeg = require('ffmpeg-bin').ffmpeg
var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

var jpegtran
var cwebp

try {
  cwebp = require('webp').cwebp
} catch (err) {}

try {
  jpegtran = require('jpegtran-bin').path
} catch (err) {}

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

      if (metadata.Format === 'GIF') {
        switch (options.format) {
          case 'gif':
            return callback(null, filename)
          case 'webm':
          case 'mp4':
            return that.convertToVideo(metadata, options, cacheImage)
        }
      }

      if (options.format === 'webp')
        return that.resizeWebP(metadata, options, cacheImage)

      if (options.format === 'jpg'
        && metadata.Format === 'JPEG'
        && jpegtran
        && !that.getResizedDimensions(metadata, options.variant.size)
      ) return that.optimizeJPEGTran(metadata, options, cacheImage)

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

  if (!this.supportedConversionFormat(metadata.format, format))
    throw this.error('unsupportedConversionFormat')

  if (~['webm', 'mp4', 'gif'].indexOf(format) && !variant[format])
    throw this.error('invalidVariant')

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
    filename + (metadata.format === 'gif' ? '[0]' : ''),
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

Simgr.prototype.resizeWebP = function (metadata, options, callback) {
  var that = this

  if (metadata.format === 'gif')
    this.convertGIFtoPNG(metadata, function (err) {
      if (err)
        return callback(err)

      that._resizeWebP(metadata, options, callback)
    })
  else
    that._resizeWebP(metadata, options, callback)

  return this
}

// Private
Simgr.prototype._resizeWebP = function (metadata, options, callback) {
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

// WebP doesn't support GIFs as an input image
Simgr.prototype.convertGIFtoPNG = function (metadata, callback) {
  var that = this
  var input = metadata.originalPath = metadata.path
  var output = metadata.path = input + '.png'

  execFile('convert', [
    input + '[0]',
    output
  ], function (err, stdout, stderr) {
    that.deleteFile(input)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback()
  })
}

// Faster than using ImageMagick
Simgr.prototype.optimizeJPEGTran = function (metadata, options, callback) {
  var that = this
  var filename = metadata.path
  var slug = options.slug
  var output = [filename, slug, 'webp'].join('.')

  var args = [
    '-copy', 'none',
    '-progressive',
    '-optimize'
  ]

  if (metadata.colorspace === 'Gray')
    args.push('-grayscale')

  args.push('-outfile', output, filename)

  execFile(jpegtran, args, function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, output)
  })
}

Simgr.prototype.convertToVideo = function (metadata, options, callback) {
  var that = this
  var filename = metadata.path
  var format = options.format
  var variant = options.variant
  var opts = variant[format]
  var width = metadata.width
  var height = metadata.height
  var maxrate = (opts.bitratefactor || 5) * width * height

  var args = [
    '-y',
    '-loglevel',
    'error',
    '-i',
    filename,
    '-c:v',
    format === 'webm' ? 'libvpx' : 'libx264',
    '-crf',
    opts.crf || 20,
    // We always want it to act as a maxrate
    format === 'webm' ? '-b:v' : '-maxrate',
    maxrate
  ]

  if (format === 'mp4') {
    args.push(
      // For whatever reason this colorspace is required
      '-pix_fmt',
      'yuv420p',
      '-bufsize',
      // Not sure what to set, so just set it to 5x the maxrate
      5 * maxrate
    )

    // No side can be odd, so if one is odd,
    // we'll just double the size.
    // May lose some color,
    // but these are GIFs anyways
    if (width % 2 || height % 2)
      args.push('-vf', 'scale=iw*2:ih*2')
  }

  var output = [filename, variant.slug, format].join('.')

  execFile(ffmpeg, args.concat(output), function (err, stdout, stderr) {
    that.deleteFile(filename)

    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, output)
  })
}

function noop() {}
var series = require('array-series')
var parallel = require('array-parallel')
var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

var gifOutputs = {
  gif: true,
  webm: true,
  mp4: true
}

var gifVideoOutputs = {
  webm: true,
  mp4: true
}

var jpegtran, cwebp, ffmpeg

try {
  cwebp = require('webp').cwebp
} catch (err) {}

try {
  jpegtran = require('jpegtran-bin').path
} catch (err) {}

try {
  ffmpeg = require('ffmpeg-bin').ffmpeg
} catch (err) {}

Simgr.prototype.getVariant = function (metadata, options, callback) {
  new Get(this, metadata, options, callback)
}

Simgr.prototype.getVariantFile = function (metadata, options, callback) {
  var that = this

  this.getVariant(metadata, options, function (err, res, signatures) {
    if (err)
      return callback(err)

    that.saveFile(res, function (err, filename) {
      callback(err, filename, res.headers, signatures)
    })
  })
}

Simgr.getResizedDimensions =
Simgr.prototype.getResizedDimensions = getResizedDimensions

// Returns (err, res, signatures)
function Get(simgr, metadata, options, callback) {
  this.simgr = simgr
  this.metadata = metadata
  this.options = options

  this.end(callback)
}

Get.prototype.end = function (callback) {
  try {
    this.checkVariant()
  } catch (err) {
    callback(err)
    return
  }

  var that = this
  var metadata = this.metadata
  var options = this.options
  var format = options.format

  // Assumes that no resizing occurs
  if (metadata.Format === 'GIF' && format === 'gif')
    return this.proxyFromS3(callback)

  this.name = [metadata.name, options.slug, format].join('.')

  this.getFromCache(function (err, res) {
    if (err || res)
      return callback(err, res)

    that.getVariant(function (err) {
      if (err)
        return callback(err)

      that.getFromCache(function (err, res) {
        callback(err, res, that.signatures)
      })
    })
  })
}

Get.prototype.getVariant = function (callback) {
  series([
    this.getFromS3,
    this.delegate,
    this.getSignatures,
    this.cacheImage
  ], this, callback)
}

// Just return the image stream
Get.prototype.proxyFromS3 = function (callback) {
  this.simgr.getFromS3(this.metadata.name, callback)
}

// Download the entire file so we can process it however we'd like
Get.prototype.getFromS3 = function (callback) {
  var metadata = this.metadata
  var simgr = this.simgr

  simgr.getFromS3(metadata.name, function (err, res) {
    if (err)
      return callback(err)

    simgr.saveFile(res, function (err, filename) {
      metadata.path = filename
      callback(err)
    })
  })
}

Get.prototype.getFromCache = function (callback) {
  this.simgr.getFromCache(this.name, callback)
}

Get.prototype.cacheImage = function (callback) {
  this.simgr.cacheVariant(this.out, this.name, this.options.format, callback)
}

Get.prototype.getSignatures = function (callback) {
  var signatures = this.signatures = []
  var out = this.out
  var format = this.options.format

  parallel([
    getFileHash,
    getImageHash
  ], callback)

  function getFileHash(done) {
    // An error should never occur
    Simgr.getHash(out, function (err, hash) {
      if (hash)
        signatures.push(hash)

      done(err)
    })
  }

  function getImageHash(done) {
    // If not an image, then this will error
    if (gifOutputs[format])
      return done()

    Simgr.getSignature(out, function (err, hash) {
      if (hash)
        signatures.push(hash)

      done(err)
    })
  }
}

Get.prototype.checkVariant = function () {
  var metadata = this.metadata
  var options = this.options
  var simgr = this.simgr

  var slug = options.slug
  if (!slug)
    throw new Error('Slug must be defined.')

  var variant =
  options.variant = simgr.variant[slug]
  if (!variant)
    throw simgr.error('undefinedVariant')

  var format =
  options.format = simgr.supportedOutputFormat(options.format
    || metadata.format
    || metadata.Format
    || 'jpg'
  )
  if (!format)
    throw simgr.error('unsupportedOutputFormat')

  if (!simgr.supportedConversionFormat(metadata.format, format))
    throw simgr.error('unsupportedConversionFormat')

  if (gifOutputs[format] && !variant[format])
    throw simgr.error('invalidVariant')
}

Get.prototype.delegate = function (callback) {
  var metadata = this.metadata
  var options = this.options
  var Format = metadata.Format
  var format = options.format

  this.out = [metadata.path, options.slug, format].join('.')
  var resize =
  this.resize = getResizedDimensions(metadata, options.variant.size)

  // Image -> WebP
  if (format === 'webp')
    return this.resizeWebP(callback)

  // Gif -> Video
  if (Format === 'GIF' && gifVideoOutputs[format])
    return this.convertToVideo(callback)

  // JPEG -> JPG without resizing
  if (format === 'jpg'
    && Format === 'JPEG'
    && jpegtran
    && !resize
  ) return this.optimizeJPEGTran(callback)

  // Default conversion
  this.resizeImagemagick(callback)
}

Get.prototype.resizeImagemagick = function (callback) {
  var metadata = this.metadata
  var options = this.options
  var format = options.format
  var variant = options.variant
  var colorspace = metadata.colorspace === 'Gray' ? 'Gray' : 'sRGB'

  var args = [
    metadata.path + (metadata.format === 'gif' ? '[0]' : ''),
    '-interlace', 'Plane',
    '-strip'
  ]

  if (this.resize && variant.resize)
    args.push(
      // Convert to a linear colorspace
      '-colorspace', 'RGB',
      '-resize', variant.resize,
      // Convert back to a nonlinear colorspace
      '-colorspace', colorspace,
      // PNG gamma isn't set correctly.
      '-set', 'colorspace', colorspace
    )
  else
    // In case we convert an image to grayscale.
    // We only allow sRGB and grayscale
    args.push(
      '-colorspace', colorspace,
      '-set', 'colorspace', colorspace
    )

  if (format === 'jpg' &&
    (!metadata.quality || metadata.quality > variant.quality)
  ) args.push('-quality', variant.quality)

  execFile('convert', args.concat(this.out), callback)
}

Get.prototype.resizeWebP = function (callback) {
  // WebP doesn't support GIFs as input images.
  if (this.metadata.format === 'gif')
    series([
      this.convertGIFtoPNG,
      this._resizeWebP
    ], this, callback)
  else
    this._resizeWebP(callback)
}

Get.prototype._resizeWebP = function (callback) {
  var metadata = this.metadata
  var options = this.options
  var variant = options.variant
  var simgr = this.simgr

  var args = [
    '-quiet',
    '-mt',
    '-q', variant.quality,
    '-m', simgr.compressionmethod
  ]

  if (simgr.lowmemory)
    args.push('-low_memory')

  var resize = this.resize
  if (resize)
    args.push('-resize', resize[0], resize[1])

  execFile(cwebp, args.concat(metadata.path, '-o', this.out), callback)
}

// WebP doesn't support GIFs as an input image.
// We also only return the first frame,
// though maybe an option to select which frame would be nice.
Get.prototype.convertGIFtoPNG = function (callback) {
  var metadata = this.metadata
  var input = metadata.originalPath = metadata.path
  var output = metadata.path = input + '.png'

  execFile('convert', [
    input + '[0]',
    output
  ], callback)
}

// Faster than using ImageMagick
Get.prototype.optimizeJPEGTran = function (callback) {
  var metadata = this.metadata
  var args = [
    '-copy', 'none',
    '-progressive',
    '-optimize'
  ]

  if (metadata.colorspace === 'Gray')
    args.push('-grayscale')

  execFile(jpegtran, args.concat('-outfile', this.out, metadata.path), callback)
}

Get.prototype.convertToVideo = function (callback) {
  var metadata = this.metadata
  var options = this.options
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
    metadata.path,
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

  execFile(ffmpeg, args.concat(this.out), callback)
}

function getResizedDimensions(metadata, resize) {
  if (!resize)
    return

  var ratios = {
    width: metadata.width / resize.width,
    height: metadata.height / resize.height
  }

  var ratio = Math.max(ratios.width, ratios.height)

  // Don't resize the image if you're not shrinking by at least 2x
  if (ratio < 2)
    return

  // If width is changing the most, we resize by it.
  return ratios.width > ratios.height
    ? [
      resize.width,
      Math.round(metadata.height / ratios.width)
    ] : [
      Math.round(metadata.width / ratios.height),
      resize.height
    ]
}
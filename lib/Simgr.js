var inherits = require('util').inherits

module.exports = Simgr

Simgr.extend = function (options) {
  function Simgr() {}

  inherits(Simgr, this)

  return new Simgr().setOptions(options)
}

function Simgr(options) {
  if (!(this instanceof Simgr))
    return new Simgr(options)

  this
  .setOptions(this.defaults)
  .setOptions(options)
}

Simgr.prototype.defaults = require('./defaults')

Simgr.prototype.error =
Simgr.prototype.errors = require('./errors')

Simgr.prototype.supportedInputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png',
  'image/tiff': 'tiff',
  'tiff': 'tiff',
  'tif': 'tiff',
  'image/gif': 'gif',
  'gif': 'gif'
}

Simgr.prototype.supportedOutputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png',
  'image/webp': 'webp',
  'webp': 'webp',
  'image/tiff': 'png',
  'tiff': 'png',
  'tif': 'png',
  'video/gif': 'gif',
  'gif': 'gif',
  'video/webm': 'webm',
  'webm': 'webm',
  'video/mp4': 'mp4',
  'mp4': 'mp4'
}

Simgr.prototype.supportedConversionFormats = {
  jpg: {
    jpg: true,
    png: true, // supported but not recommended
    webp: true
  },
  png: {
    jpg: true,
    png: true,
    webp: true
  },
  tiff: {
    png: true,
    jpg: true,
    webp: true
  },
  gif: {
    png: true, // first frame
    jpg: true, // first frame
    webp: true, // first frame
    gif: true, // original
    webm: true,
    mp4: true
  }
}

Simgr.prototype.mimeTypes = {
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'tiff': 'image/tiff',
  'gif': 'image/gif',
  'webm': 'video/webm',
  'mp4': 'video/mp4'
}

Simgr.prototype.supportedColorspaces = {
  'srgb': true,
  // Note: this is for supporting older versions
  // of IM. Newer ones will generally show sRGB.
  // I don't think any images are actually RGB colorspace.
  'rgb': true,
  'gray': true
}

// When there's a 90 + 180x flip,
// the width and height dimensions are flipped
// https://github.com/aheckmann/gm/blob/master/lib/convenience/autoOrient.js#L8
Simgr.prototype.flipDimensions = {
  'lefttop': true,
  'righttop': true,
  'rightbottom': true,
  'leftbottom': true
}

Simgr.prototype.supportedInputFormat = function (format) {
  return this.supportedInputFormats[format.toLowerCase()]
}

Simgr.prototype.supportedOutputFormat = function (format) {
  return this.supportedOutputFormats[format.toLowerCase()]
}

Simgr.prototype.supportedConversionFormat = function (input, output) {
  return this.supportedConversionFormats[input][output] || false
}

Simgr.prototype.supportedColorspace = function (colorspace) {
  return this.supportedColorspaces[colorspace.toLowerCase()]
}

Simgr.prototype.flipDimension = function (orientation) {
  return this.flipDimensions[orientation.toLowerCase()]
}

Simgr.prototype.setOptions = function (options) {
  if (!options)
    return this

  ;[
    'quality',
    'maxsize',
    'maxarea',
    'compressionmethod'
  ].forEach(function (key) {
    if (typeof options[key] === 'number')
      this[key] = options[key]
  }, this)

  if (typeof options.lowmemory === 'boolean')
    this.lowmemory = options.lowmemory

  if (typeof options.tmpdir === 'string')
    this.setTmpdir(options.tmpdir)

  this.setS3Client(options.s3)
  this.setCacheClient(options.cache)
  this.setVariants(options)

  return this
}

Simgr.prototype.setVariants = function (options) {
  if (!Array.isArray(options.variants))
    return this

  var variants = this.variant = {}

  ;(this.variants = options.variants)
  .forEach(function (variant) {
    var size = variant.size

    variant.quality = variant.quality
      || options.quality
      || this.quality

    if (typeof size === 'number') {
      size = variant.size = {
        width: size,
        height: size,
        option: '>' // Never enlarge, only shrink
      }
    } else if (Object(size) === size) {
      // Set to '' to override
      if (typeof size.option !== 'string')
        size.option = '>'
    }

    // Allow optional width and height parameters
    if (size)
      variant.resize = size.width + 'x' + size.height + size.option

    variants[variant.slug] = variant
  }, this)

  return this
}
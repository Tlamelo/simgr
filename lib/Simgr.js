var inherits = require('util').inherits

module.exports = Simgr

Simgr.extend = function (options) {
  function Simgr() {}

  inherits(Simgr, this)

  Object.keys(this).forEach(function (key) {
    Simgr[key] = this[key]
  }, this)

  return new Simgr().setOptions(options)
}

function Simgr(options) {
  if (!(this instanceof Simgr))
    return new Simgr(options)

  this
  .setOptions(this.defaults)
  .setOptions(options)
}

Simgr.defaults =
Simgr.prototype.defaults = require('./defaults')

Simgr.error =
Simgr.errors =
Simgr.prototype.error =
Simgr.prototype.errors = require('./errors')

Simgr.supportedInputFormats =
Simgr.prototype.supportedInputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png',
  'image/gif': 'gif',
  'gif': 'gif'
}

Simgr.supportedOutputFormats =
Simgr.prototype.supportedOutputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png',
  'image/gif': 'gif',
  'gif': 'gif'
}

Simgr.supportedConversionFormats =
Simgr.prototype.supportedConversionFormats = {
  jpg: {
    jpg: true,
    png: true, // supported but not recommended
  },
  png: {
    jpg: true,
    png: true,
  },
  tiff: {
    png: true,
    jpg: true,
  },
  gif: {
    png: true, // first frame
    jpg: true, // first frame
    gif: true, // original
  }
}

Simgr.mimeTypes =
Simgr.prototype.mimeTypes = {
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'tiff': 'image/tiff',
  'gif': 'image/gif',
  'webm': 'video/webm',
  'mp4': 'video/mp4'
}

Simgr.supportedColorspaces =
Simgr.prototype.supportedColorspaces = {
  'srgb': true,
  // Note: this is for supporting older versions
  // of IM. Newer ones will generally show sRGB.
  // I don't think any images are actually RGB colorspace.
  'rgb': true,
  'gray': true
}

Simgr.supportedInputFormat =
Simgr.prototype.supportedInputFormat = function (format) {
  return this.supportedInputFormats[format.toLowerCase()]
}

Simgr.supportedOutputFormat =
Simgr.prototype.supportedOutputFormat = function (format) {
  return this.supportedOutputFormats[format.toLowerCase()]
}

Simgr.supportedConversionFormat =
Simgr.prototype.supportedConversionFormat = function (input, output) {
  return this.supportedConversionFormats[input][output] || false
}

Simgr.supportedColorspace =
Simgr.prototype.supportedColorspace = function (colorspace) {
  return this.supportedColorspaces[colorspace.toLowerCase()]
}

Simgr.prototype.setOptions = function (options) {
  if (!options)
    return

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

  this.setStoreClient(options.store)
  this.setCacheClient(options.cache)
  this.setVariants(options)

  return this
}

Simgr.prototype.setVariants = function (options) {
  if (!Array.isArray(options.variants))
    return

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
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

Simgr.prototype.gm = require('gm').subClass({
  imageMagick: true
})

Simgr.prototype.defaults = require('./defaults')

Simgr.prototype.error =
Simgr.prototype.errors = require('./errors')

Simgr.prototype.supportedInputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png'
}

Simgr.prototype.supportedOutputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png',
  'image/webp': 'webp',
  'webp': 'webp'
}

Simgr.prototype.mimeTypes = {
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp'
}

Simgr.prototype.supportedInputFormat = function (format) {
  return this.supportedInputFormats[format.toLowerCase()]
}

Simgr.prototype.supportedOutputFormat = function (format) {
  return this.supportedOutputFormats[format.toLowerCase()]
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

  this.setAWSClient(options.s3)
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
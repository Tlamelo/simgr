var knox = require('knox')
var gm = require('gm')
var fs = require('fs')
var path = require('path')
var os = require('os')
var crypto = require('crypto')

module.exports = Simgr

Simgr.defaults =
Simgr.prototype.defaults = require('./defaults')

Simgr.error =
Simgr.errors =
Simgr.prototype.error =
Simgr.prototype.errors = require('./errors')

var tmpdir =
Simgr.tmpdir =
Simgr.prototype.tmpdir = process.env.TEMP_DIR || os.tmpdir()

function Simgr(options) {
  if (!(this instanceof Simgr))
    return new Simgr(options)

  this
  .setOptions(this.constructor.defaults)
  .setOptions(options)
}

Simgr.supportedInputFormats =
Simgr.prototype.supportedInputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png'
}

Simgr.supportedOutputFormats =
Simgr.prototype.supportedOutputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png'
}

Simgr.supportedInputFormat =
Simgr.prototype.supportedInputFormat = function (format) {
  return Simgr.supportedInputFormats[format.toLowerCase()]
}

Simgr.supportedOutputFormat =
Simgr.prototype.supportedOutputFormat = function (format) {
  return this.supportedOutputFormats[format.toLowerCase()]
}

Simgr.prototype.setOptions = function (options) {
  options = options || {}

  this.setGM(options.imageMagick)
  this.setAWSClient(options.s3)

  ;[
    'quality',
    'maxsize',
    'maxarea'
  ].forEach(function (key) {
    if (typeof options[key] === 'number')
      this[key] = options[key]
  }, this)

  this.setVariants(options)

  return this
}

Simgr.prototype.setGM = function (imageMagick) {
  if (typeof imageMagick === 'boolean')
    this.gm =
    this.constructor.gm = imageMagick
      ? gm.subClass({
        imageMagick: true
      }) : gm

  return this
}

Simgr.prototype.setAWSClient = function (options) {
  if (options && options.secret && options.key && options.bucket)
    this.awsClient = knox.createClient(options)

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
      variant.size = {
        width: size,
        height: size,
        option: '>' // Never enlarge, only shrink
      }
    } else if (Object(size) === size) {
      size.option = size.option || '>'
    }

    variants[variant.slug] = variant
  }, this)

  return this
}

Simgr.prototype.checkAWSClient = function () {
  if (!(this.awsClient))
    throw new Error('AWS client required!')

  return this
}

Simgr.prototype.saveFile = function (stream, callback) {
  var location = path.join(tmpdir, 'simgr_' +
    crypto.pseudoRandomBytes(12).toString('hex')
  )
  var writeStream = fs.createWriteStream(location)

  writeStream.once('error', callback.bind(this))
  writeStream.once('finish', callback.bind(this, null, location))

  stream.pipe(writeStream)

  return location
}

// Only want to keep context in the callback
Simgr.prototype.identify = function (path, callback) {
  this.gm(path).identify(callback.bind(this))

  return this
}
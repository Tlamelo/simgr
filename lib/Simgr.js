var knox = require('knox')
var gm = require('gm')
var util = require('util')
var fs = require('fs')
var path = require('path')
var events = require('events')
var os = require('os')
var crypto = require('crypto')

util.inherits(Simgr, events.EventEmitter)

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

Simgr.supportedInputFormat =
Simgr.prototype.supportedInputFormat = function (format) {
  return Simgr.supportedInputFormats[format.toLowerCase()]
}

Simgr.supportedOutputFormats =
Simgr.prototype.supportedOutputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'image/png': 'png',
  'png': 'png'
}

Simgr.supportedOutputFormat =
Simgr.prototype.supportedOutputFormat = function (format) {
  return this.supportedOutputFormats[format.toLowerCase()]
}

Simgr.prototype.quality =
Simgr.prototype.maxage =
Simgr.prototype.maxsize =
Simgr.prototype.maxarea = null
Simgr.prototype.setOptions = function (options) {
  options = options || {}

  this.setGM(options.imageMagick)
  this.setAWSClient(options.s3)
  this.setVariants(options)

  ;[
    'quality',
    'maxage',
    'maxsize',
    'maxarea'
  ].forEach(function (key) {
    if (typeof options[key] === 'number')
      this[key] = options[key]
  }, this)

  return this
}

Simgr.prototype.gm = null
Simgr.prototype.setGM = function (imageMagick) {
  if (typeof imageMagick === 'boolean')
    this.gm =
    this.constructor.gm = imageMagick
      ? gm.subClass({
        imageMagick: true
      }) : gm

  return this
}

Simgr.prototype.awsClient = null
Simgr.prototype.setAWSClient = function (options) {
  if (options)
    this.awsClient = knox.createClient(options)

  return this
}

Simgr.prototype.variant = null // slug lookup
Simgr.prototype.variants = null // array lookup
Simgr.prototype.setVariants = function (options) {
  if (!Array.isArray(options.variants))
    return this

  var variants = this.variant = {}

  ;(this.variants = options.variants)
  .forEach(function (variant) {
    var size = variant.size

    variant.quality = variant.quality || options.quality

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
  })

  return this
}

Simgr.prototype.checkAWSClient = function () {
  if (!(this.awsClient))
    throw new Error('AWS client required!')

  return this
}

Simgr.prototype.getName = function (metadata, options) {
  options = options || {}

  var name = metadata.name

  if (!name)
    throw new Error('You should intelligently name your images!')

  var slug = options.slug || metadata.slug
  if (slug)
    name += '.' + slug

  return name + '.' + this.supportedOutputFormat(options.format
    || metadata.format
    || metadata.identity.format
  )
}

// Add an optional format for easy `putFile`ing
Simgr.prototype.createFileName = function (format, callback) {
  var that = this

  crypto.pseudoRandomBytes(12, function (err, buf) {
    if (err)
      return callback.call(that, err)

    var location = path.join(tmpdir, 'simgr_' + buf.toString('hex'))
    if (format)
      location += '.' + format

    callback.call(that, null, location)
  })

  return this
}

Simgr.prototype.saveFile = function (stream, format, callback) {
  this.createFileName(format, function (err, location) {
    if (err)
      return callback.call(this, err)

    var writeStream = fs.createWriteStream(location)

    writeStream.once('error', callback.bind(this))
    writeStream.once('finish', callback.bind(this, null, location))

    stream.pipe(writeStream)
  })

  return this
}

Simgr.prototype.deleteFile = function (path) {
  fs.unlink(path, noop)

  return this
}

// Only want to keep context in the callback
Simgr.prototype.identify = function (path, callback) {
  this.gm(path).identify(callback.bind(this))

  return this
}

Simgr.prototype.stat = function (path, callback) {
  fs.stat(path, callback.bind(this))

  return this
}

function noop() {}
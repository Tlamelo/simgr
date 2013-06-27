var knox = require('knox')
var gm = require('gm')
var util = require('util')
var fs = require('fs')
var path = require('path')
var events = require('events')
var os = require('os')
var crypto = require('crypto')

Service.defaults =
Service.prototype.defaults = require('./defaults')

Service.error =
Service.errors =
Service.prototype.error =
Service.prototype.errors = require('./errors')

var tmpdir =
Service.tmpdir =
Service.prototype.tmpdir = process.env.TEMP_DIR || os.tmpdir()

util.inherits(Service, events.EventEmitter)

module.exports = Service

function Service(options) {
  if (!(this instanceof Service))
    return new Service(options)

  this
  .setOptions(this.constructor.defaults)
  .setOptions(options)
}

Service.supportedInputFormats =
Service.prototype.supportedInputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpeg',
  'image/png': 'png',
  'png': 'png'
}

Service.supportedInputFormat =
Service.prototype.supportedInputFormat = function (format) {
  return Service.supportedInputFormats[format.toLowerCase()]
}

Service.supportedOutputFormats =
Service.prototype.supportedOutputFormats = {
  'image/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpeg',
  'image/png': 'png',
  'png': 'png'
}

Service.supportedOutputFormat =
Service.prototype.supportedOutputFormat = function (format) {
  return this.supportedOutputFormats[format.toLowerCase()]
}

Service.prototype.quality =
Service.prototype.maxage =
Service.prototype.maxsize =
Service.prototype.maxarea = null
Service.prototype.setOptions = function (options) {
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
  })

  return this
}

Service.prototype.gm = null
Service.prototype.setGM = function (imageMagick) {
  if (typeof imageMagick === 'boolean')
    this.gm =
    this.constructor.gm = imageMagick
      ? gm.subClass({
        imageMagick: true
      }) : gm

  return this
}

Service.prototype.awsClient = null
Service.prototype.setAWSClient = function (options) {
  if (options)
    this.awsClient = knox.createClient(options)

  return this
}

Service.prototype.variant = null // slug lookup
Service.prototype.variants = null // array lookup
Service.prototype.setVariants = function (options) {
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

Service.prototype.checkAWSClient = function () {
  if (!(this.awsClient))
    throw new Error('AWS client required!')

  return this
}

Service.prototype.getName = function (metadata, slug) {
  var name = metadata.name

  if (!name)
    throw new Error('You should intelligently name your images!')

  if (slug = slug || metadata.slug)
    name += '.' + slug

  return name + this.supportedOutputFormat(metadata.identity.format.toLowerCase())
}

// Add an optional format for easy `putFile`ing
Service.prototype.createFileName = function (format, callback) {
  var that = this

  crypto.pseudoRandomBytes(12, function (err, buf) {
    if (err)
      return callback.call(that, err)

    var location = path.join(tmpdir, 'irp_' + buf.toString('hex'))
    if (format)
      location += '.' + format

    callback.call(that, null, location)
  })

  return this
}

Service.prototype.saveFile = function (stream, format, callback) {
  this.createFileName(format, function (err, location) {
    if (err)
      return callback.call(this, err)

    var writeStream = fs.createWriteStream(location)

    writeStream.once('error', callback.bind(this))
    writeStream.once('end', callback.bind(this, null, location))

    stream.pipe(writeStream)
  })

  return this
}

Service.prototype.deleteFile = function (path) {
  fs.unlink(path, noop)

  return this
}

// Only want to keep context in the callback
Service.prototype.identify = function (path, callback) {
  this.gm(path).identify(callback.bind(this))

  return this
}

Service.prototype.stat = function (path, callback) {
  fs.stat(path, callback.bind(this))

  return this
}

function noop() {}
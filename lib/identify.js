var crypto = require('crypto')
var fs = require('fs')
var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

// http://www.imagemagick.org/script/escape.php
// We only get the attributes we need.
// This removes any dependency on a parser,
// as well as speeding the identification process.
// identify -verbose is unnecessary.
var attributes = [
  '%m', // format
  '%#', // signature
  '%b', // filesize
  '%Q', // quality
  '%n', // frames
  '%[colorspace]', // duh
  '%[orientation]',
  '%w', // width
  '%h' // height
].join(' ')

Simgr.prototype.identifyImage = function (metadata, callback) {
  if (typeof metadata === 'string')
    metadata = {
      path: metadata
    }

  var that = this

  execFile('identify', [
    '-format',
    attributes,
    metadata.path
  ], function (err, stdout, stderr) {
    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    var attrs = stdout.toString().trim().split(' ')
    // Capitalized format
    metadata.Format = attrs.shift()
    metadata.signature = attrs.shift()
    metadata.length = parseInt(attrs.shift(), 10)
    metadata.quality = parseInt(attrs.shift(), 10) || 0
    metadata.frames = parseInt(attrs.shift(), 10) || 0
    metadata.colorspace = attrs.shift()
    metadata.orientation = attrs.shift()

    if (that.flipDimension(metadata.orientation)) {
      metadata.autoorient = true
      metadata.height = parseInt(attrs.shift(), 10)
      metadata.width = parseInt(attrs.shift(), 10)
    } else {
      metadata.width = parseInt(attrs.shift(), 10)
      metadata.height = parseInt(attrs.shift(), 10)
    }

    metadata.pixels = metadata.width * metadata.height

    if (!(metadata.format = that.supportedInputFormat(metadata.Format)))
      return callback(that.error('unsupportedInputFormat'))

    if (metadata.length > that.maxsize)
      return callback(that.error('imageSizeTooLarge'))

    if (metadata.pixels > that.maxarea)
      return callback(that.error('imageAreaTooLarge'))

    that.validateImageFile(metadata, callback)
  })

  return this
}

Simgr.prototype.validateImageFile = function (metadata, callback) {
  var filename = metadata.path
  var args = []

  // Convert single-frame GIFs to PNG
  if (metadata.Format === 'GIF' && metadata.frames === 1) {
    args.push('-format', 'PNG')
    metadata.Format = 'PNG'
    metadata.format = 'png'
  }

  // Autoorient the image so we don't have to later
  if (metadata.autoorient) {
    args.push('-auto-orient')
    metadata.orientation = 'Undefined'
  }

  // Convert non-supported colorspaces to sRGB
  if (!this.supportedColorspace(metadata.colorspace)) {
    args.push('-colorspace', 'sRGB')
    metadata.colorspace = 'sRGB'
  }

  // No need to do anything here.
  if (!args.length)
    return callback()

  var newfile = metadata.path = filename + '.2'
  metadata.originalPath = filename

  execFile('convert', [filename].concat(args, newfile), function (err, stdout, stderr) {
    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, metadata)
  })

  return this
}

// For etags and stuff
Simgr.prototype.getSignature = function (filename, callback) {
  execFile('identify', [
    '-format',
    '%#',
    filename
  ], function (err, stdout, stderr) {
    if (err || stderr)
      return callback(err || new Error(stderr.toString()))

    callback(null, stdout.toString().trim())
  })

  return this
}

// Only if the signature won't be supported
Simgr.prototype.getHash = function (filename, callback) {
  var called

  fs.createReadStream(filename)
  .on('error', onError)
  .pipe(crypto.createHash('sha256'))
  .on('error', onError)
  .on('readable', function () {
    if (called)
      return

    called = true
    callback(null, this.read().toString('hex'))
  })

  function onError(err) {
    if (called)
      return

    called = true
    callback(err)
  }

  return this
}
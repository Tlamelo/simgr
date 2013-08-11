var series = require('array-series')
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
  '%[colorspace]',
  '%[orientation]',
  '%w', // width
  '%h' // height
].join(' ') + ' ' // add a trailing space to differentiate frames

var oriented = {
  'topleft': true,
  'undefined': true
}

Simgr.getSignature =
Simgr.prototype.getSignature = getSignature

Simgr.prototype.identifyImage = function (metadata, callback) {
  new Identify(this, metadata, callback)
}

function Identify(simgr, metadata, callback) {
  this.metadata = metadata
  this.simgr = simgr

  this.end(callback)
}

Identify.prototype.end = function (callback) {
  series([
    this.identifyImage,
    this.validateImageFile,
    this.recalculateGifHash
  ], this, callback)
}

Identify.prototype.identifyImage = function (callback) {
  var metadata = this.metadata
  var simgr = this.simgr

  execFile('identify', [
    '-format',
    attributes,
    metadata.path
  ], function (err, stdout) {
    if (err)
      return callback(err)

    var attrs = stdout.toString().trim().split(' ')

    // Capitalized format
    metadata.Format = attrs.shift()
    metadata.signatures = [attrs.shift()]
    metadata.length = parseInt(attrs.shift(), 10)
    metadata.quality = parseInt(attrs.shift(), 10) || 0
    metadata.frames = parseInt(attrs.shift(), 10) || 0
    metadata.colorspace = attrs.shift()

    var orientation = metadata.orientation = attrs.shift()
    if (!oriented[orientation.toLowerCase()])
      metadata.autoorient = true

    if (Simgr.flipDimension(orientation)) {
      metadata.height = parseInt(attrs.shift(), 10)
      metadata.width = parseInt(attrs.shift(), 10)
    } else {
      metadata.width = parseInt(attrs.shift(), 10)
      metadata.height = parseInt(attrs.shift(), 10)
    }

    metadata.pixels = metadata.width * metadata.height

    if (!(metadata.format = Simgr.supportedInputFormat(metadata.Format)))
      return callback(Simgr.error('unsupportedInputFormat'))
    if (metadata.length > simgr.maxsize)
      return callback(Simgr.error('imageSizeTooLarge'))
    if (metadata.pixels > simgr.maxarea)
      return callback(Simgr.error('imageAreaTooLarge'))

    callback()
  })
}

Identify.prototype.validateImageFile = function (callback) {
  var metadata = this.metadata
  var filename = metadata.path
  var format = metadata.Format
  var args = []

  if (format === 'GIF') {
    // Convert single-frame GIFs to PNG
    if (metadata.frames === 1) {
      args.push('-format', 'PNG')
      metadata.Format = 'PNG'
      metadata.format = 'png'
    } else {
      // Don't do any conversions to GIFs
      callback()
      return
    }
  }

  // Convert webp images to PNG so we can use cwebp
  if (format === 'WEBP') {
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
  if (!Simgr.supportedColorspace(metadata.colorspace)) {
    args.push('-colorspace', 'sRGB')
    metadata.colorspace = 'sRGB'
  }

  // No need to do anything here.
  if (!args.length)
    return callback()

  var newfile = metadata.path = filename + '.2'
  metadata.originalPath = filename

  execFile('convert', [filename].concat(args, newfile), function (err) {
    if (err)
      return callback(err)

    getSignature(newfile, function (err, signature) {
      if (err)
        return callback(err)

      if (!~metadata.signatures.indexOf(signature))
        metadata.signatures.push(signature)

      callback()
    })
  })
}

// Signatures are on a per-frame basis.
// We want to treat GIFs signatures like files'
Identify.prototype.recalculateGifHash = function (callback) {
  var metadata = this.metadata
  if (metadata.Format !== 'GIF')
    return callback()

  Simgr.getHash(metadata.path, function (err, signature) {
    if (err)
      return callback(err)

    metadata.signatures = [signature]
    callback()
  })
}

function getSignature(filename, callback) {
  execFile('identify', [
    '-format',
    '%#',
    filename
  ], callback)
}
var series = require('array-series')
var parallel = require('array-parallel')
var mmm = require('mmmagic')
var execFile = require('child_process').execFile
var debug = require('debug')('simgr')

var Magic = mmm.Magic
var magic = new Magic(mmm.MAGIC_MIME_TYPE)

var Simgr = require('./Simgr')

// http://www.imagemagick.org/script/escape.php
var attributes = [
  '%m', // format
  '%b', // filesize
  '%[jpeg:quality]', // quality
  '%n', // frames
  '%[colorspace]',
  '%[EXIF:Orientation]',
  '%w', // width
  '%h', // height
  '%#', // signature
].join('|') + '|'

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
    this.checkImage,
    this.getHash,
    this.identifyImage,
    this.validateImageFile
  ], this, callback)
}

Identify.prototype.checkImage = function (callback) {
  magic.detectFile(this.metadata.path, function (err, result) {
    if (err)
      return callback(err)

    // If mmmagic doesn't know, it'll return an octet stream.
    if (result !== 'application/octet-stream' && result.slice(0, 6) !== 'image/')
      return callback(Simgr.error('file-not-an-image'))

    callback()
  })
}

Identify.prototype.getHash = function (callback) {
  var metadata = this.metadata

  Simgr.getHash(metadata.path, function (err, signature) {
    if (err)
      return callback(err)

    metadata.signatures = [signature]
    callback()
  })
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

    debug('identify stdout: ' + stdout.toString())

    var attrs = stdout.toString('utf8').trim().split('|')

    // Slice because GIFs will have info for every freaking frame,
    // but only identifying the first frame
    // will not give us the correct frame count
    debug('identify: ' + attrs.slice(0, 9))

    // Capitalized format
    metadata.Format = attrs.shift()
    metadata.length = parseInt(attrs.shift(), 10)
    metadata.quality = parseInt(attrs.shift(), 10) || 0
    metadata.frames = parseInt(attrs.shift(), 10) || 1
    metadata.colorspace = attrs.shift()

    var orientation =
    metadata.orientation = parseInt(attrs.shift(), 10) || 1
    if (orientation !== 1)
      metadata.autoorient = true

    // http://sylvana.net/jpegcrop/exif_orientation.html
    if (orientation >= 5) {
      metadata.height = parseInt(attrs.shift(), 10)
      metadata.width = parseInt(attrs.shift(), 10)
    } else {
      metadata.width = parseInt(attrs.shift(), 10)
      metadata.height = parseInt(attrs.shift(), 10)
    }

    metadata.pixels = metadata.width * metadata.height

    if (!(metadata.Format === 'GIF' && metadata.frames > 1))
      metadata.signatures.push(attrs.shift())

    if (!(metadata.format = Simgr.supportedInputFormat(metadata.Format)))
      return callback(Simgr.error('unsupported-input-format'))
    if (metadata.length > simgr.maxsize)
      return callback(Simgr.error('image-size-too-large'))
    if (metadata.pixels > simgr.maxarea)
      return callback(Simgr.error('image-area-too-large'))

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

    pushSignatures(metadata, callback)
  })
}

function pushSignatures(metadata, callback) {
  parallel([pushSignature, pushHash], callback)

  function pushSignature(done) {
    getSignature(metadata.path, function (err, signature) {
      if (err)
        return done(err)

      if (!~metadata.signatures.indexOf(signature))
        metadata.signatures.push(signature)

      done()
    })
  }

  function pushHash(done) {
    Simgr.getHash(metadata.path, function (err, signature) {
      if (err)
        return done(err)

      if (!~metadata.signatures.indexOf(signature))
        metadata.signatures.push(signature)

      done()
    })
  }
}

function getSignature(filename, callback) {
  execFile('identify', [
    '-format',
    '%# ',
    filename
  ], function (err, stdout) {
    if (err)
      return callback(err)

    callback(null, stdout.toString('utf8').split(/\s+/).shift())
  })
}
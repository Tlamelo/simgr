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
  '%[colorspace]', // duh
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
    metadata.colorspace = attrs.shift()
    metadata.width = parseInt(attrs.shift(), 10)
    metadata.height = parseInt(attrs.shift(), 10)
    metadata.pixels = metadata.width * metadata.height

    if (!(metadata.format = that.supportedInputFormat(metadata.Format)))
      return callback(that.error('unsupportedInputFormat'))

    if (metadata.length > that.maxsize)
      return callback(that.error('imageSizeTooLarge'))

    if (metadata.pixels > that.maxarea)
      return callback(that.error('imageAreaTooLarge'))

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
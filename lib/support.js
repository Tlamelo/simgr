var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

var inputFormats = Simgr.prototype.supportedInputFormats
var outputFormats = Simgr.prototype.supportedOutputFormats

execFile('convert', ['-list', 'format'], function (err, stdout) {
  if (err)
    throw new Error('Imagemagick error. Maybe you don\'t have it installed.')

  // brew install imagemagick by default
  // does not support TIFF
  if (~stdout.indexOf('TIFF')) {
    inputFormats['image/tiff'] =
    inputFormats['tiff'] =
    inputFormats['tif'] = 'tiff'

    outputFormats['image/tiff'] =
    outputFormats['tiff'] =
    outputFormats['tif'] = 'png'
  }

  // ImageMagick by default does not support WebP
  // if (~stdout.indexOf('WEBP')) {

  // }
})
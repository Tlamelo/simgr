var ffmpeg = require('ffmpeg-bin').ffmpeg
var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

var inputFormats = Simgr.prototype.supportedInputFormats
var outputFormats = Simgr.prototype.supportedOutputFormats
var conversionFormats = Simgr.prototype.supportedConversionFormats

// Check ImageMagick input format support
execFile('convert', ['-list', 'format'], function (err, stdout) {
  if (err)
    throw new Error('Imagemagick error. Maybe you don\'t have it installed.')

  stdout = stdout.toString()

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
  if (~stdout.indexOf('WEBP')) {
    inputFormats['image/webp'] =
    inputFormats['webp'] = 'webp'
  }
})

// Check ffmpeg encoding support
execFile(ffmpeg, ['-encoders'], function (err, stdout) {
  if (err)
    return

  if (~stdout.indexOf('libvpx')) {
    outputFormats['video/webm'] =
    outputFormats['webm'] = 'webm'

    conversionFormats['gif']['webm'] = true
  }

  if (~stdout.indexOf('libx264')) {
    outputFormats['video/mp4'] =
    outputFormats['mp4'] = 'mp4'

    conversionFormats['gif']['mp4'] = true
  }
})
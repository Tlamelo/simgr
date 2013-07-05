var fs = require('fs')
var execFile = require('child_process').execFile

var Simgr = require('./Simgr')

// http://www.imagemagick.org/script/escape.php

// For etags and stuff
Simgr.prototype.getSignature = function (filename, callback) {
  execFile('identify', [
    '-format',
    '%#',
    filename
  ], function (err, stdout, stderr) {
    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    callback(null, stdout.toString().trim())
  })

  return this
}

Simgr.prototype.getFilesize = function (filename, callback) {
  fs.stat(filename, function (err, stats) {
    if (err)
      return callback(err)

    callback(null, stats.length)
  })

  return this
}

Simgr.prototype.getDimensions = function (filename, callback) {
  execFile('identify', [
    '-format',
    '%G',
    filename
  ], function (err, stdout, stderr) {
    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    var dimensions = stdout.toString()
    .split('x')
    .map(toInteger)

    callback(null, {
      width: dimensions.shift(),
      height: dimensions.shift()
    })
  })

  return this
}

Simgr.prototype.getFormat = function (filename, callback) {
  execFile('identify', [
    '-format',
    '%m',
    filename
  ], function (err, stdout, stderr) {
    if (err)
      return callback(err)

    if (stderr)
      return callback(new Error(stderr.toString()))

    callback(null, stdout.toString().trim())
  })

  return this
}

function toInteger(x) {
  return parseInt(x, 10)
}
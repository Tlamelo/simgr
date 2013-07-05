var path = require('path')
var fs = require('fs')
var os = require('os')
var crypto = require('crypto')

var Simgr = require('./Simgr')

Simgr.prototype.tmpdir = process.env.TEMP_DIR
  || os.tmpdir()

Simgr.prototype.createFilename = function () {
  return path.join(this.tmpdir, 'simgr_' +
    crypto.pseudoRandomBytes(12).toString('hex')
  )
}

Simgr.prototype.saveFile = function (stream, callback) {
  var location = this.createFilename()
  var writeStream = fs.createWriteStream(location)

  writeStream.once('error', callback)
  writeStream.once('error', this.deleteFile.bind(this, location))
  writeStream.once('finish', callback.bind(null, null, location))

  stream.pipe(writeStream)

  return location
}

Simgr.prototype.deleteFile = function (filename) {
  try {
    fs.unlink(filename, noop)
  } catch (err) {}
}

function noop() {}
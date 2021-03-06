var path = require('path')
var fs = require('fs')
var crypto = require('crypto')
var saveTo = require('save-to')
var getHash = require('hash-stream')

var Simgr = require('./Simgr')

Simgr.prototype.setTmpdir = function (tmpdir) {
  try {
    fs.mkdirSync(this.tmpdir = path.join(tmpdir, 'simgr'))
  } catch (err) {}
}

Simgr.prototype.createFilename = function () {
  return path.join(
    this.tmpdir,
    crypto.pseudoRandomBytes(12).toString('hex')
  )
}

Simgr.prototype.saveFile = function (stream, callback) {
  saveTo(stream, {
    destination: this.createFilename(),
    expected: stream.headers && stream.headers['content-length'],
    limit: this.maxsize
  }, callback)
}

Simgr.getHash =
Simgr.prototype.getHash = function (filename, callback) {
  getHash(filename, 'sha256', function (err, hash) {
    callback(err, hash && hash.toString('hex'))
  })
}
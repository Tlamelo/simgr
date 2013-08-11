var path = require('path')
var fs = require('fs')
var crypto = require('crypto')

var useClose = parseInt(process.version.split('.')[1], 10) < 9

var Simgr = require('./Simgr')

Simgr.prototype.setTmpdir = function (tmpdir) {
  try {
    fs.mkdirSync(this.tmpdir = path.join(tmpdir, 'simgr'))
  } catch (err) {}

  return this
}

Simgr.prototype.createFilename = function () {
  return path.join(
    this.tmpdir,
    crypto.pseudoRandomBytes(12).toString('hex')
  )
}

Simgr.prototype.saveFile = function (stream, callback) {
  var location = this.createFilename()
  var writeStream = fs.createWriteStream(location)

  writeStream.once('error', callback)
  writeStream.once('error', this.deleteFile.bind(this, location))
  writeStream.once(useClose ? 'close' : 'finish', callback.bind(null, null, location))

  stream.pipe(writeStream)

  return location
}

Simgr.deleteFile =
Simgr.prototype.deleteFile = function (filename) {
  try {
    fs.unlink(filename, noop)
  } catch (err) {}

  return this
}

Simgr.getHash =
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

function noop() {}
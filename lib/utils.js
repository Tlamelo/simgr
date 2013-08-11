var path = require('path')
var fs = require('fs')
var crypto = require('crypto')

var finishEvent = parseInt(process.version.split('.')[1], 10) < 9
  ? 'close'
  : 'finish'

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
  var location = this.createFilename()
  var writeStream = fs.createWriteStream(location)

  writeStream.once('error', callback)
  writeStream.once(finishEvent, callback.bind(null, null, location))

  stream.pipe(writeStream)
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
}
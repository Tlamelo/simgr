var path = require('path')
var fs = require('fs')
var simgr = require('../')()

describe('Put', function () {
  describe('JPG', function () {
    var file = path.join(__dirname, 'originalSideways.jpg')

    it('should work', function (done) {
      simgr.identifyImage(fs.createReadStream(file), {
        name: 'originalSideways'
      }, function (err, metadata) {
        if (err)
          throw err

        metadata.path.should.be.ok
        metadata.stats.should.be.ok
        metadata.identity.should.be.ok
        metadata.format.should.equal('jpg')

        simgr.uploadImage(metadata, function (err) {
          if (err)
            throw err

          metadata.filename.should.equal('originalSideways.jpg')

          done()
        })
      })
    })
  })

  describe('PNG', function () {
    var file = path.join(__dirname, 'taylor-swift.png')

    it('should work', function (done) {
      simgr.identifyImage(fs.createReadStream(file), {
        name: 'taylor-swift'
      }, function (err, metadata) {
        if (err)
          throw err

        metadata.path.should.be.ok
        metadata.stats.should.be.ok
        metadata.identity.should.be.ok
        metadata.format.should.equal('png')

        simgr.uploadImage(metadata, function (err) {
          if (err)
            throw err

          metadata.filename.should.equal('taylor-swift.png')

          done()
        })
      })
    })
  })

  describe('GIF', function () {
    var file = path.join(__dirname, 'crazy-laugh.gif')

    it('should throw', function (done) {
      simgr.identifyImage(fs.createReadStream(file), null, function (err) {
        if (!err)
          throw new Error()

        done()
      })
    })
  })
})
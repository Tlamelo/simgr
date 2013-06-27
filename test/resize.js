var path = require('path')
var fs = require('fs')
var service = require('../')()

describe('Resize', function () {
  describe('JPG', function () {
    var file = path.join(__dirname, 'originalSideways.jpg')
    var readStream = service.resizeImage(fs.createReadStream(file), null, 'a', 'jpg')
    var identity

    it('should work', function (done) {
      readStream.on('error', done)
      service.identify(readStream, function (err, _identity) {
        if (err) throw err

        identity = _identity
        done()
      })
    })

    it('should be the correct size', function () {
      var size = identity.size
      size.width.should.be.below(121)
      size.height.should.be.below(121)
    })

    it('should be progressive', function () {
      identity.Interlace.should.not.equal('None')
    })

    it('should have less than 85 quality', function () {
      parseInt(identity.Quality || identity['JPEG-Quality'], 10).should.be.below(86)
    })

    it('should auto orient', function () {
      identity.Orientation.should.equal('Undefined')
    })
  })
})
var path = require('path')
var fs = require('fs')
var service = require('../')()

describe('Resize', function () {
  describe('JPG', function () {
    var file = path.join(__dirname, 'originalSideways.jpg')
    var identity

    it('should work', function (done) {
      service.resizeImage(fs.createReadStream(file), null, {
        slug: 'a',
        format: 'jpg'
      }, function (err, location) {
        if (err)
          throw err

        service.identify(location, function (err, _identity) {
          if (err)
            throw err

          identity = _identity
          done()
        })
      })
    })

    it('should be the correct size', function () {
      var size = identity.size
      size.width.should.equal(120)
      size.height.should.equal(40)
    })

    it('should be progressive', function () {
      identity.Interlace.should.not.equal('None')
    })

    it('should have less than 85 quality', function () {
      parseInt(identity.Quality || identity['JPEG-Quality'], 10).should.equal(85)
    })

    it('should auto orient', function () {
      identity.Orientation.should.equal('Undefined')
    })
  })

  describe('PNG', function () {

  })

  describe('GIF', function () {

  })
})
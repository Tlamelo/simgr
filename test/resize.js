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

    it('should have 85 quality', function () {
      parseInt(identity.Quality || identity['JPEG-Quality'], 10).should.equal(85)
    })

    it('should auto orient', function () {
      identity.Orientation.should.equal('Undefined')
    })
  })

  describe('PNG', function () {
    var file = path.join(__dirname, 'taylor-swift.png')
    var identity

    it('should work', function (done) {
      service.resizeImage(fs.createReadStream(file), null, {
        slug: 'a',
        format: 'png'
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
      size.width.should.equal(81)
      size.height.should.equal(120)
    })

    it('should be progressive', function () {
      identity.Interlace.should.not.equal('None')
    })
  })

  describe('GIF', function () {
    it('should throw', function () {
      ;(function () {
        service.resizeImage(fs.createReadStream(path.join(__dirname, 'crazy-laugh.gif')), null, {
          slug: 'a',
          format: 'gif'
        }, function (err) {
          if (err)
            throw err
        })
      }).should.throw()
    })
  })

  describe('PNG to JPG', function () {
    var file = path.join(__dirname, 'taylor-swift.png')
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
      size.width.should.equal(81)
      size.height.should.equal(120)
    })

    it('should be progressive', function () {
      identity.Interlace.should.not.equal('None')
    })

    it('should have 85 quality', function () {
      parseInt(identity.Quality || identity['JPEG-Quality'], 10).should.equal(85)
    })

    it('should be JPEG', function () {
      identity.format.should.equal('JPEG')
    })
  })
})
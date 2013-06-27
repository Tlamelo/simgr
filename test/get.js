var path = require('path')
var fs = require('fs')
var service = require('../')()

describe('Get', function () {
  describe('JPG', function () {
    var file = path.join(__dirname, 'originalSideways.jpg')
    var identity

    it('should work', function (done) {
      service.identifyImage(fs.createReadStream(file), {
        name: 'originalSideways'
      }, function (err, metadata) {
        if (err)
          throw err

        service.uploadImage(metadata, function (err) {
          if (err)
            throw err

          service.getVariant(metadata, {
            slug: 'a'
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
      parseInt(identity.Quality || identity['JPEG-Quality'], 10).should.be.below(86)
    })

    it('should auto orient', function () {
      identity.Orientation.should.equal('Undefined')
    })
  })

  var metadata

  describe('PNG', function () {
    var file = path.join(__dirname, 'taylor-swift.png')
    var identity

    it('should work', function (done) {
      service.identifyImage(fs.createReadStream(file), {
        name: 'taylor-swift'
      }, function (err, _metadata) {
        if (err)
          throw err

        metadata = _metadata

        service.uploadImage(metadata, function (err) {
          if (err)
            throw err

          service.getVariant(metadata, {
            slug: 'a'
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

  describe('PNG to JPEG', function () {
    var identity

    it('should work', function (done) {
      service.getVariant(metadata, {
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
      parseInt(identity.Quality || identity['JPEG-Quality'], 10).should.be.below(86)
    })

    it('should be JPEG', function () {
      identity.format.should.equal('JPEG')
    })
  })
})
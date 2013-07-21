var path = require('path')
var fs = require('fs')
var gm = require('gm').subClass({
  imageMagick: true
})
var simgr = require('../')()

var gif = path.join(__dirname, 'crazy-laugh.gif')
var jpg = path.join(__dirname, 'originalSideways.jpg')
var png = path.join(__dirname, 'taylor-swift.png')

describe('GIF', function () {
  describe('PUT', function () {
    it('should not identify', function (done) {
      simgr.identifyImage(gif, function (err) {
        if (!err)
          throw new Error()

        done()
      })
    })
  })
})

describe('JPEG', function () {
  var metadata = {
    name: 'originalSideways',
    path: jpg
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, function (err) {
        if (err)
          throw err

        metadata.Format.should.equal('JPEG')
        metadata.format.should.equal('jpg')
        metadata.length.should.be.ok
        metadata.quality.should.be.ok
        metadata.colorspace.should.be.ok
        metadata.width.should.be.ok
        metadata.height.should.be.ok
        metadata.pixels.should.be.ok

        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })

    it('should have dimensions in the proper order', function () {
      metadata.width.should.be.above(metadata.height)
    })
  })

  describe('GET JPEG', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename

        gm(filename).identify(function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity

          done()
        })
      })
    })

    it('should get the signature', function (done) {
      simgr.getSignature(filename, function (err, signature) {
        if (err)
          throw err

        metadata['a.jpg'].Properties.signature.should.equal(signature)
        done()
      })
    })

    it('should be a JPEG', function () {
      metadata['a.jpg'].format.should.equal('JPEG')
    })

    it('should be the correct size', function () {
      var size = metadata['a.jpg'].size
      size.width.should.equal(120)
      size.height.should.equal(40)
    })

    it('should be progressive', function () {
      metadata['a.jpg'].Interlace.should.not.equal('None')
    })

    it('should have 80 quality', function () {
      parseInt(metadata['a.jpg'].Quality, 10).should.be.below(81)
    })

    it('should auto orient', function () {
      var identity = metadata['a.jpg']
      identity.Orientation.should.equal('Undefined')
      identity.size.width.should.be.above(identity.size.height)
    })
  })

  describe('GET PNG', function () {
    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'png'
      }, function (err, filename) {
        if (err)
          throw err

        gm(filename).identify(function (err, identity) {
          if (err)
            throw err

          metadata['a.png'] = identity
          done()
        })
      })
    })

    it('should be a PNG', function () {
      metadata['a.png'].format.should.equal('PNG')
    })

    it('should be the correct size', function () {
      var size = metadata['a.png'].size
      size.width.should.equal(120)
      size.height.should.equal(40)
    })

    it('should be progressive', function () {
      metadata['a.png'].Interlace.should.not.equal('None')
    })

    it('should auto orient', function () {
      metadata['a.png'].Orientation.should.equal('Undefined')
    })
  })

  describe('GET GIF', function () {
    it('should error', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'gif'
      }, function (err) {
        if (!err)
          throw new Error()

        done()
      })
    })
  })

  describe('GET WEBP', function () {
    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'webp'
      }, function (err, location) {
        if (err)
          throw err

        fs.stat(location, done)
      })
    })
  })

  describe('GET JPEG JPEGTRAN', function () {
    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'o'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename

        gm(filename).identify(function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity

          done()
        })
      })
    })
  })
})

describe('PNG', function () {
  var metadata = {
    name: 'taylor-swift',
    path: png
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, function (err) {
        if (err)
          throw err

        metadata.Format.should.equal('PNG')
        metadata.format.should.equal('png')
        metadata.length.should.be.ok
        metadata.quality.should.equal(0)
        metadata.colorspace.should.be.ok
        metadata.width.should.be.ok
        metadata.height.should.be.ok
        metadata.pixels.should.be.ok
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })
  })

  describe('GET PNG', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename

        gm(filename).identify(function (err, identity) {
          if (err)
            throw err

          metadata['a.png'] = identity

          done()
        })
      })
    })

    it('should get the signature', function (done) {
      simgr.getSignature(filename, function (err, signature) {
        if (err)
          throw err

        metadata['a.png'].Properties.signature.should.equal(signature)
        done()
      })
    })

    it('should have 0.45455 gamma', function () {
      metadata['a.png'].Gamma.should.equal('0.45455')
    })

    it('should be a PNG', function () {
      metadata['a.png'].format.should.equal('PNG')
    })

    it('should be the correct size', function () {
      var size = metadata['a.png'].size
      size.width.should.equal(81)
      size.height.should.equal(120)
    })

    it('should be progressive', function () {
      metadata['a.png'].Interlace.should.not.equal('None')
    })
  })

  describe('GET JPEG', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'jpg'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename

        gm(filename).identify(function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity
          done()
        })
      })
    })

    it('should get signature', function (done) {
      simgr.getSignature(filename, function (err, signature) {
        if (err)
          throw err

        metadata['a.jpg'].Properties.signature.should.equal(signature)
        done()
      })
    })

    it('should be a JPEG', function () {
      metadata['a.jpg'].format.should.equal('JPEG')
    })

    it('should be the correct size', function () {
      var size = metadata['a.jpg'].size
      size.width.should.equal(81)
      size.height.should.equal(120)
    })

    it('should be progressive', function () {
      metadata['a.jpg'].Interlace.should.not.equal('None')
    })

    it('should have 80 quality', function () {
      parseInt(metadata['a.jpg'].Quality, 10).should.be.below(81)
    })
  })

  describe('GET GIF', function () {
    it('should error', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'gif'
      }, function (err) {
        if (!err)
          throw new Error()

        done()
      })
    })
  })

  describe('GET WEBP', function () {
    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'webp'
      }, function (err, location) {
        if (err)
          throw err

        fs.stat(location, done)
      })
    })
  })
})

describe('Grayscale', function () {
  var metadata = {
    name: 'justin',
    path: path.join(__dirname, 'justin.jpg')
  }

  describe('PUT', function (done) {
    it('should work', function (done) {
      simgr.identifyImage(metadata, function (err) {
        if (err)
          throw err

        metadata.colorspace.should.equal('Gray')

        simgr.uploadImage(metadata, done)
      })
    })
  })

  describe('GET', function (done) {
    var filename

    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'l',
        format: 'jpg'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename

        done()
      })
    })

    it('should still be grayscale', function (done) {
      gm(filename).identify(function (err, identity) {
        if (err)
          throw err

        identity.Colorspace.should.equal('Gray')

        done()
      })
    })
  })
})

describe('TIFF', function () {
  var metadata = {
    name: 'tiff',
    path: path.join(__dirname, 'tiff.tiff')
  }

  describe('PUT', function (done) {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })

    it('should be tiff', function () {
      metadata.format.should.equal('tiff')
    })
  })

  describe('GET TIFF', function () {
    it('should return a png', function (done) {
      simgr.getVariant(metadata, {
        slug: 'l',
        format: 'tiff'
      }, function (err, filename) {
        if (err)
          throw err

        gm(filename).format(function (err, format) {
          if (err)
            throw err

          format.should.equal('PNG')
          done()
        })
      })
    })
  })

  describe('GET PNG', function () {
    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'l',
        format: 'png'
      }, done)
    })

    it('should get PNG by default', function (done) {
      simgr.getVariant(metadata, {
        slug: 'l'
      }, function (err, filename) {
        if (err)
          throw err

        gm(filename).format(function (err, format) {
          if (err)
            throw err

          format.should.equal('PNG')
          done()
        })
      })
    })
  })
})

describe('CMYK', function () {
  var metadata = {
    name: 'cmyk',
    path: path.join(__dirname, 'girls.jpg')
  }

  describe('PUT', function (done) {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })

    it('should be sRGB', function () {
      metadata.colorspace.should.equal('sRGB')
    })
  })

  describe('GET JPEG', function () {
    var filename

    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'jpg'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should be sRGB', function (done) {
      gm(filename).identify(function (err, identity) {
        if (err)
          throw err

        identity.Colorspace.should.equal('sRGB')
        done()
      })
    })
  })

  describe('GET WEBP', function () {
    it('should work', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'webp'
      }, done)
    })
  })
})
var path = require('path')
var fs = require('fs')
var ffmeta = require('fluent-ffmpeg').Metadata
var gm = require('gm').subClass({
  imageMagick: true
})
var simgr = require('../')()

var gif = path.join(__dirname, 'crazy-laugh.gif')
var jpg = path.join(__dirname, 'originalSideways.jpg')
var png = path.join(__dirname, 'taylor-swift.png')
var sunflower = path.join(__dirname, 'sunflower.gif')

describe('GIF', function () {
  var metadata = {
    name: 'crazy-laugh',
    path: gif
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should have the correct frames', function () {
      metadata.frames.should.equal(119)
    })

    it('should have the correct dimensions', function () {
      metadata.width.should.equal(230)
      metadata.height.should.equal(175)
    })

    it('should have a different signature than the first frame', function (done) {
      gm(gif).identify('%# ', function (err, signatures) {
        if (err)
          throw err

        var signature = signatures.split(' ').shift()

        metadata.signatures[0].should.not.equal(signature)
        metadata.signatures.length.should.equal(1)
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
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
        done()
      })
    })

    it('should be JPEG', function (done) {
      gm(filename).format(function (err, format) {
        if (err)
          throw err

        format.should.equal('JPEG')

        done()
      })
    })

    it('should have 1 frame', function (done) {
      gm(filename).identify('%n', function (err, frames) {
        if (err)
          throw err

        frames.should.equal('1')
        done()
      })
    })
  })

  describe('GET WEBP', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'webp'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    // it('should be WEBP', function (done) {
    //   gm(filename).format(function (err, format) {
    //     if (err)
    //       throw err

    //     format.should.equal('WEBP')

    //     done()
    //   })
    // })

    // it('should have 1 frame', function (done) {
    //   gm(filename).identify('%n', function (err, frames) {
    //     if (err)
    //       throw err

    //     frames.should.equal('1')
    //     done()
    //   })
    // })
  })

  describe('GET GIF', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'o',
        format: 'gif'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should be the same image', function (done) {
      simgr.getHash(gif, function (err, hash) {
        if (err)
          throw err

        simgr.getHash(filename, function (err, hash2) {
          if (err)
            throw err

          hash.should.equal(hash2)
          done()
        })
      })
    })

    it('should not allow gif resizes', function (done) {
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

  describe('GET WEBM', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'o',
        format: 'webm'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should have vp8 encoding', function (done) {
      ffmeta(filename, function (metadata, err) {
        if (err)
          throw err

        metadata.video.codec.should.equal('vp8')
        done()
      })
    })
  })

  describe('GET MP4', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'o',
        format: 'mp4'
      }, function (err, _filename) {
        if (err)
          throw err

        filename = _filename
        done()
      })
    })

    it('should have h264 encoding', function (done) {
      ffmeta(filename, function (metadata, err) {
        if (err)
          throw err

        metadata.video.codec.should.equal('h264')
        done()
      })
    })
  })
})

describe('GIF SINGLE', function () {
  var metadata = {
    name: 'sunflower',
    path: sunflower
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, done)
    })

    it('should be PNG', function () {
      metadata.format.should.equal('png')
      metadata.Format.should.equal('PNG')
    })

    it('should have the original', function () {
      metadata.originalPath.should.equal(sunflower)
    })

    it('should have one signature', function () {
      metadata.signatures.length.should.equal(1)
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
        metadata.signatures.length.should.equal(2)

        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })

    it('should have dimensions in the proper order', function () {
      metadata.width.should.be.above(metadata.height)
    })

    it('should save the original', function () {
      metadata.originalPath.should.equal(jpg)
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
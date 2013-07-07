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
      metadata['a.jpg'].Orientation.should.equal('Undefined')
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
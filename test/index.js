var path = require('path')
var fs = require('fs')
var simgr = require('../')()

var gif = path.join(__dirname, 'crazy-laugh.gif')
var jpg = path.join(__dirname, 'originalSideways.jpg')
var png = path.join(__dirname, 'taylor-swift.png')

describe('GIF', function () {
  describe('PUT', function () {
    it('should throw', function (done) {
      simgr.identifyImage(fs.createReadStream(gif), {}, function (err) {
        if (!err)
          throw new Error()

        done()
      })
    })
  })
})

describe('JPEG', function () {
  var metadata = {
    name: 'originalSideways'
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(fs.createReadStream(jpg), metadata, function (err) {
        if (err)
          throw err

        metadata.path.should.be.ok
        metadata.identity.should.be.ok
        metadata.identity.format.should.equal('JPEG')
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })

    it('should delete the uploaded file', function (done) {
      setTimeout(function () {
        metadata.path.should.be.ok

        fs.stat(metadata.path, function (err) {
          if (!err)
            throw new Error()

          done()
        })
      }, 10)
    })
  })

  describe('GET JPEG', function () {
    var signature

    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a'
      }, function (err, filename) {
        if (err)
          return done(err)

        simgr.identify(filename, function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity

          done.identify = true
          if (done.signature)
            done()
        })

        simgr.getSignature(filename, function (err, _signature) {
          if (err)
            throw err

          signature = _signature

          done.signature = true
          if (done.identify)
            done()
        })
      })
    })

    it('should get the signature', function () {
      metadata['a.jpg'].Properties.signature.should.equal(signature)
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

    it('should have 85 quality', function () {
      var identity = metadata['a.jpg']
      parseInt(identity.Quality || identity['JPEG-Quality'] || 0, 10).should.be.below(86)
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
          return done(err)

        simgr.identify(filename, function (err, identity) {
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
})

describe('PNG', function () {
  var metadata = {
    name: 'taylor-swift'
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(fs.createReadStream(png), metadata, function (err) {
        if (err)
          throw err

        metadata.path.should.be.ok
        metadata.identity.should.be.ok
        metadata.identity.format.should.equal('PNG')
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })
  })

  describe('GET PNG', function () {
    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a'
      }, function (err, filename) {
        if (err)
          return done(err)

        simgr.identify(filename, function (err, identity) {
          if (err)
            throw err

          metadata['a.png'] = identity

          done.identify = true
          if (done.signature)
            done()
        })

        simgr.getSignature(filename, function (err, _signature) {
          if (err)
            throw err

          signature = _signature

          done.signature = true
          if (done.identify)
            done()
        })
      })
    })

    it('should get the signature', function () {
      metadata['a.png'].Properties.signature.should.equal(signature)
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
    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a',
        format: 'jpg'
      }, function (err, filename) {
        if (err)
          throw err

        simgr.identify(filename, function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity
          metadata['a.jpg.filename'] = filename
          done()
        })
      })
    })

    it('should get signature', function (done) {
      simgr.getSignature(metadata['a.jpg.filename'], function (err, signature) {
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

    it('should have 85 quality', function () {
      var identity = metadata['a.jpg']
      parseInt(identity.Quality || identity['JPEG-Quality'] || 0, 10).should.be.below(86)
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
})
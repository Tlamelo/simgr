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
        metadata.stats.should.be.ok
        metadata.identity.should.be.ok
        metadata.identity.format.should.equal('JPEG')
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })
  })

  describe('GET JPEG', function () {
    it('should create a variant', function (done) {
      simgr.getVariant(metadata, {
        slug: 'a'
      }, function (err, location) {
        if (err)
          throw err

        simgr.identify(location, function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity
          done()
        })
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
      }, function (err, location) {
        if (err)
          throw err

        simgr.identify(location, function (err, identity) {
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
        if (!err || err.key !== 'unsupportedOutputFormat')
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
        metadata.stats.should.be.ok
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
      }, function (err, location) {
        if (err)
          throw err

        simgr.identify(location, function (err, identity) {
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
      }, function (err, location) {
        if (err)
          throw err

        simgr.identify(location, function (err, identity) {
          if (err)
            throw err

          metadata['a.jpg'] = identity
          done()
        })
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
        if (!err || err.key !== 'unsupportedOutputFormat')
          throw new Error()

        done()
      })
    })
  })
})
describe('JPEG', function () {
  var image = path.join(__dirname, 'images', 'originalSideways.jpg')

  var metadata = {
    name: 'originalSideways' + rand,
    path: image
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, function (err) {
        assert.ifError(err)

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
      metadata.originalPath.should.equal(image)
    })
  })

  describe('GET JPEG', function () {
    var filename

    it('should create a variant', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a'
      }, function (err, _filename) {
        assert.ifError(err)

        filename = _filename

        gm(filename).identify(function (err, identity) {
          assert.ifError(err)

          metadata['a.jpg'] = identity

          done()
        })
      })
    })

    it('should get the signature', function (done) {
      simgr.getSignature(filename, function (err, signature) {
        assert.ifError(err)

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
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'png'
      }, function (err, filename) {
        assert.ifError(err)

        gm(filename).identify(function (err, identity) {
          assert.ifError(err)

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
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'gif'
      }, function (err) {
        assert.ok(err)
        done()
      })
    })
  })

  describe('GET WEBP', function () {
    var filename

    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'webp'
      }, function (err, location) {
        assert.ifError(err)

        filename = location
        fs.stat(location, done)
      })
    })

    // This test will fail on machines that do not support WebP in ImageMagick
    /*
    it('should be the correct size', function (done) {
      gm(filename).size(function (err, size) {
        assert.ifError(err)

        size.width.should.equal(120)
        size.height.should.equal(40)

        done()
      })
    })
    */
  })

  describe('GET JPEG JPEGTRAN', function () {
    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'o'
      }, function (err, _filename) {
        assert.ifError(err)

        filename = _filename

        gm(filename).identify(function (err, identity) {
          assert.ifError(err)

          metadata['a.jpg'] = identity
          done()
        })
      })
    })
  })
})
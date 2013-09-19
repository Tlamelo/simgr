describe('PNG', function () {
  var image = path.join(__dirname, 'images', 'taylor-swift.png')

  var metadata = {
    name: 'taylor-swift' + rand,
    path: image
  }

  describe('PUT', function () {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, function (err) {
        assert.ifError(err)

        metadata.Format.should.equal('PNG')
        metadata.format.should.equal('png')
        metadata.length.should.be.ok
        // Bugging out on travis
        // metadata.quality.should.equal(0)
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
      simgr.getVariantFile(metadata, {
        slug: 'a'
      }, function (err, _filename) {
        assert.ifError(err)

        filename = _filename

        gm(filename).identify(function (err, identity) {
          assert.ifError(err)

          metadata['a.png'] = identity
          done()
        })
      })
    })

    it('should get the signature', function (done) {
      simgr.getSignature(filename, function (err, signature) {
        assert.ifError(err)

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
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'jpg'
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

    it('should get signature', function (done) {
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

    it('should be the correct size', function (done) {
      gm(filename).size(function (err, size) {
        assert.ifError(err)

        size.width.should.equal(81)
        size.height.should.equal(120)

        done()
      })
    })
  })
})
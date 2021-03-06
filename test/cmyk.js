describe('CMYK', function () {
  var image = path.join(__dirname, 'images', 'girls.jpg')

  var metadata = {
    name: 'cmyk' + rand,
    path: image
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
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'jpg'
      }, function (err, _filename) {
        assert.ifError(err)

        filename = _filename
        done()
      })
    })

    it('should be sRGB', function (done) {
      gm(filename).identify(function (err, identity) {
        assert.ifError(err)

        identity.Colorspace.should.equal('sRGB')
        done()
      })
    })
  })

  describe('GET WEBP', function () {
    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'a',
        format: 'webp'
      }, done)
    })
  })

  describe('GET JPEG L', function () {
    var filename

    it('should work', function (done) {
      simgr.getVariantFile(metadata, {
        slug: 'l',
        format: 'jpg'
      }, function (err, _filename) {
        assert.ifError(err)

        filename = _filename
        done()
      })
    })

    it('should be original size because it did not shrink by 2x', function (done) {
      gm(filename).size(function (err, size) {
        assert.ifError(err)

        size.width.should.equal(metadata.width)
        size.height.should.equal(metadata.height)
        done()
      })
    })
  })
})
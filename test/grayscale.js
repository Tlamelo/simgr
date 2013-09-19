describe('Grayscale', function () {
  var image = path.join(__dirname, 'images', 'justin.jpg')

  var metadata = {
    name: 'justin' + rand,
    path: image
  }

  describe('PUT', function (done) {
    it('should identify', function (done) {
      simgr.identifyImage(metadata, function (err) {
        assert.ifError(err)

        metadata.colorspace.should.equal('Gray')
        done()
      })
    })

    it('should upload', function (done) {
      simgr.uploadImage(metadata, done)
    })
  })

  describe('GET', function (done) {
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

    it('should still be grayscale', function (done) {
      gm(filename).identify(function (err, identity) {
        assert.ifError(err)

        identity.Colorspace.should.equal('Gray')
        done()
      })
    })
  })
})